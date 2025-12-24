package com.example._Klinik;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {

	public static void main(String[] args) {
		// .env dosyasını yükle
		Dotenv dotenv = Dotenv.configure()
				.ignoreIfMissing()
				.load();

		// Environment variable'ları sistem özelliklerine aktar
		dotenv.entries().forEach(entry ->
			System.setProperty(entry.getKey(), entry.getValue())
		);

		SpringApplication.run(Application.class, args);
	}

}
