using StackExchange.Redis;
using System.Text.Json;

namespace Services;

public interface IRedisService
{
    Task<T?> GetAsync<T>(string key);
    Task<bool> SetAsync<T>(string key, T value, TimeSpan? expiration = null);
    Task<bool> DeleteAsync(string key);
    Task<bool> DeleteByPatternAsync(string pattern);
    Task<bool> AcquireLockAsync(string lockKey, string lockValue, TimeSpan expiration);
    Task<bool> ReleaseLockAsync(string lockKey, string lockValue);
    bool IsConnected();
}

public class RedisService : IRedisService
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly IDatabase? _database;
    private readonly ILogger<RedisService> _logger;
    private readonly bool _isEnabled;

    public RedisService(IConfiguration configuration, ILogger<RedisService> logger)
    {
        _logger = logger;
        var redisSettings = configuration.GetSection("Redis");
        _isEnabled = redisSettings.GetValue<bool>("Enabled");

        if (!_isEnabled)
        {
            _logger.LogWarning("Redis is disabled in configuration. Service will operate in fallback mode.");
            return;
        }

        try
        {
            var connectionString = redisSettings.GetValue<string>("ConnectionString");

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                _logger.LogWarning("Redis connection string is not configured. Service will operate in fallback mode.");
                _isEnabled = false;
                return;
            }

            var options = ConfigurationOptions.Parse(connectionString);
            options.AbortOnConnectFail = false;
            options.ConnectTimeout = 5000;
            options.SyncTimeout = 5000;
            options.AsyncTimeout = 5000;
            options.ConnectRetry = 3;

            _redis = ConnectionMultiplexer.Connect(options);
            _database = _redis.GetDatabase();

            _logger.LogInformation("Redis connection established successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to Redis. Service will operate in fallback mode.");
            _isEnabled = false;
            _redis?.Dispose();
            _redis = null;
            _database = null;
        }
    }

    public bool IsConnected()
    {
        return _isEnabled && _redis != null && _redis.IsConnected && _database != null;
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        if (!IsConnected())
        {
            _logger.LogDebug("Redis is not available. Skipping cache read for key: {Key}", key);
            return default;
        }

        try
        {
            var value = await _database!.StringGetAsync(key);

            if (value.IsNullOrEmpty)
            {
                _logger.LogDebug("Cache miss for key: {Key}", key);
                return default;
            }

            _logger.LogDebug("Cache hit for key: {Key}", key);
            return JsonSerializer.Deserialize<T>(value!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading from Redis for key: {Key}", key);
            return default;
        }
    }

    public async Task<bool> SetAsync<T>(string key, T value, TimeSpan? expiration = null)
    {
        if (!IsConnected())
        {
            _logger.LogDebug("Redis is not available. Skipping cache write for key: {Key}", key);
            return false;
        }

        try
        {
            var serializedValue = JsonSerializer.Serialize(value);

            // Use the correct overload based on whether expiration is provided
            bool result;
            if (expiration.HasValue)
            {
                result = await _database!.StringSetAsync(key, serializedValue, expiration.Value);
            }
            else
            {
                result = await _database!.StringSetAsync(key, serializedValue);
            }

            if (result)
            {
                _logger.LogDebug("Successfully cached key: {Key} with expiration: {Expiration}", key, expiration);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error writing to Redis for key: {Key}", key);
            return false;
        }
    }

    public async Task<bool> DeleteAsync(string key)
    {
        if (!IsConnected())
        {
            _logger.LogDebug("Redis is not available. Skipping cache delete for key: {Key}", key);
            return false;
        }

        try
        {
            var result = await _database!.KeyDeleteAsync(key);

            if (result)
            {
                _logger.LogDebug("Successfully deleted cache key: {Key}", key);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting from Redis for key: {Key}", key);
            return false;
        }
    }

    public async Task<bool> DeleteByPatternAsync(string pattern)
    {
        if (!IsConnected())
        {
            _logger.LogDebug("Redis is not available. Skipping pattern delete for: {Pattern}", pattern);
            return false;
        }

        try
        {
            var server = _redis!.GetServer(_redis.GetEndPoints().First());
            var keys = server.Keys(pattern: pattern);
            var deletedCount = 0;

            foreach (var key in keys)
            {
                if (await _database!.KeyDeleteAsync(key))
                {
                    deletedCount++;
                }
            }

            _logger.LogDebug("Deleted {Count} keys matching pattern: {Pattern}", deletedCount, pattern);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting by pattern from Redis: {Pattern}", pattern);
            return false;
        }
    }

    public async Task<bool> AcquireLockAsync(string lockKey, string lockValue, TimeSpan expiration)
    {
        if (!IsConnected())
        {
            _logger.LogWarning("Redis is not available. Cannot acquire lock for: {LockKey}. This may cause race conditions!", lockKey);
            return true; // Fallback: allow operation to proceed
        }

        try
        {
            var acquired = await _database!.StringSetAsync(
                lockKey,
                lockValue,
                expiration,
                When.NotExists
            );

            if (acquired)
            {
                _logger.LogDebug("Successfully acquired lock: {LockKey}", lockKey);
            }
            else
            {
                _logger.LogDebug("Failed to acquire lock: {LockKey}", lockKey);
            }

            return acquired;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error acquiring lock from Redis: {LockKey}", lockKey);
            return true; // Fallback: allow operation to proceed
        }
    }

    public async Task<bool> ReleaseLockAsync(string lockKey, string lockValue)
    {
        if (!IsConnected())
        {
            _logger.LogDebug("Redis is not available. Skipping lock release for: {LockKey}", lockKey);
            return false;
        }

        try
        {
            var script = @"
                if redis.call('get', KEYS[1]) == ARGV[1] then
                    return redis.call('del', KEYS[1])
                else
                    return 0
                end
            ";

            var result = await _database!.ScriptEvaluateAsync(
                script,
                new RedisKey[] { lockKey },
                new RedisValue[] { lockValue }
            );

            var released = (int)result == 1;

            if (released)
            {
                _logger.LogDebug("Successfully released lock: {LockKey}", lockKey);
            }

            return released;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error releasing lock from Redis: {LockKey}", lockKey);
            return false;
        }
    }
}
