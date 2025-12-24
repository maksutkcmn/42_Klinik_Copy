package com.example._Klinik;


import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

class ChatResponse {
    private String message;
    private String expertise;

    public ChatResponse(String message, String expertise) {
        this.message = message;
        this.expertise = expertise;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getexpertise() { return expertise; }
    public void setexpertise(String expertise) { this.expertise = expertise; }

}

@RestController
@CrossOrigin(origins = "*")
public class ChatStarter {
    private final ChatModel chatModel;
    private final Map<String, String> qaMap = new HashMap<>();
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    public ChatStarter(ChatModel _chatModel){
        chatModel = _chatModel;
        initializeQA();
    }

    private void initializeQA() {
        qaMap.put("Nasıl randevu oluşturabilirim?", "Sayfamızın sağ üst köşesinde bulunan 'Randevu Oluştur' butonu ile istediğiniz bölümden alanında uzman doktorlarımızdan randevu alabilirsiniz.");
        qaMap.put("Randevumu nasıl iptal edebilirim?", "Sayfamızın orta kısmında bulunan 'Randevularınız' kısmından iptal etmek istediğiniz randevuyu seçip iptal edebilirsiniz.");
        qaMap.put("aynı gün randevu alabilir miyim", "Evet, uygun doktor varsa aynı gün randevu verebiliyoruz.");
        qaMap.put("hangi bölümleriniz var", "Dahiliye, Göz Hastalıkları, Diş ve Kulak Burun Boğaz polikliniklerimiz bulunmaktadır.");
        qaMap.put("randevuya gelirken yanımda ne getirmeliyim", "Kimlik belgenizi, sigorta kartınızı ve varsa eski raporlarınızı getirmeniz yeterlidir.");
        qaMap.put("kan tahlili yaptırabilir miyim", "Evet, laboratuvarımızda tüm kan tahlilleri yapılmaktadır. Randevu almanıza gerek yoktur.");
        qaMap.put("tahlil sonuçlarını ne zaman alabilirim", "Rutin kan tahlili sonuçları aynı gün, özel testler 2-3 gün içinde hazır olur.");

        qaMap.put("göğsümde ağrı var", "Göğüs ağrısı ciddi olabilir. Kalp, akciğer veya mide problemlerinden kaynaklanabilir. Kliniğimizin Dahiliye bölümünden randevu almanızı öneriyoruz. Eğer şiddetli ağrı varsa acilen hastaneye başvurun.");
        qaMap.put("nefes almakta zorlanıyorum", "Nefes darlığı astım, akciğer enfeksiyonu veya kalp problemlerinden kaynaklanabilir. Dahiliye bölümümüzden randevu alarak muayene olmanızı öneriyoruz.");
        qaMap.put("sürekli yorgunum", "Kronik yorgunluk anemi, tiroid hastalıkları, diyabet veya uyku bozukluklarından kaynaklanabilir. Dahiliye bölümümüzden randevu alarak genel kontrol yaptırmanızı öneriyoruz.");
        qaMap.put("karın ağrım var", "Karın ağrısı gastrit, ülser, apandisit veya bağırsak problemlerinden kaynaklanabilir. Dahiliye bölümümüzden randevu almanızı öneriyoruz.");
        qaMap.put("sık sık ateşim çıkıyor", "Tekrarlayan ateş enfeksiyon, grip veya kronik hastalık belirtisi olabilir. Dahiliye bölümümüzden muayene olmanızı öneriyoruz.");
        qaMap.put("mide yanması var", "Mide yanması reflü veya gastrit belirtisi olabilir. Dahiliye bölümümüzden randevu alarak tedavi olabilirsiniz.");
        qaMap.put("şekerim yüksek", "Yüksek kan şekeri diyabet belirtisi olabilir. Dahiliye bölümümüzde diyabet takibi ve tedavisi yapılmaktadır.");
        qaMap.put("tansiyon sorunum var", "Yüksek veya düşük tansiyon Dahiliye bölümümüzde takip edilir. Randevu alarak düzenli kontrol yaptırabilirsiniz.");
        qaMap.put("sırtım ağrıyor", "Sırt ağrısı kas gerginliği, böbrek taşı veya omurga problemlerinden kaynaklanabilir. Dahiliye bölümünden muayene olmanızı öneriyoruz.");

        qaMap.put("gözümde ağrı var", "Göz ağrısı enfeksiyon, arpacık veya glokom gibi ciddi sorunlardan kaynaklanabilir. Göz Hastalıkları bölümümüzden acil randevu almanızı öneriyoruz.");
        qaMap.put("bulanık görüyorum", "Bulanık görme miyop, hipermetrop, katarakt veya retina problemlerinden kaynaklanabilir. Göz Hastalıkları bölümümüzden muayene olmanızı öneriyoruz.");
        qaMap.put("gözümde kızarıklık var", "Göz kızarıklığı konjonktivit (göz iltihabı), alerjik reaksiyon veya yorgunluktan kaynaklanabilir. Göz Hastalıkları bölümümüzden randevu alabilirsiniz.");
        qaMap.put("gözümde kaşıntı var", "Göz kaşıntısı genellikle alerjik konjonktivit veya kuru göz sendromundan kaynaklanır. Göz Hastalıkları bölümümüzden muayene olabilirsiniz.");
        qaMap.put("gözümde sulanma var", "Göz sulanması tıkanık gözyaşı kanalı, enfeksiyon veya alerjiden kaynaklanabilir. Göz Hastalıkları bölümümüzden randevu almanızı öneriyoruz.");
        qaMap.put("gözümde yanma var", "Göz yanması kuru göz, alerjik reaksiyon veya enfeksiyondan kaynaklanabilir. Göz Hastalıkları bölümümüzden muayene olabilirsiniz.");
        qaMap.put("gözlüğe ihtiyacım var mı", "Görme problemleriniz varsa Göz Hastalıkları bölümümüzde göz muayenesi yaparak gözlük reçetesi alabilirsiniz.");
        qaMap.put("gece görmekte zorlanıyorum", "Gece körlüğü A vitamini eksikliği veya retina problemlerinden kaynaklanabilir. Göz Hastalıkları bölümümüzden muayene olmanızı öneriyoruz.");

        qaMap.put("dişim ağrıyor", "Diş ağrısı çürük, apse veya diş eti iltihabından kaynaklanabilir. Diş bölümümüzden randevu alarak tedavi olabilirsiniz.");
        qaMap.put("diş etim kanıyor", "Diş eti kanaması genellikle periodontal hastalık (diş eti iltihabı) belirtisidir. Diş bölümümüzden muayene olmanızı öneriyoruz.");
        qaMap.put("ağız kokum var", "Ağız kokusu diş çürüğü, diş eti hastalıkları veya sindirim problemlerinden kaynaklanabilir. Diş bölümümüzden kontrol yaptırabilirsiniz.");
        qaMap.put("dişim hassas", "Diş hassasiyeti mine erozyonu, diş çürüğü veya diş eti çekilmesinden kaynaklanabilir. Diş bölümümüzden tedavi olabilirsiniz.");
        qaMap.put("diş çektirmek istiyorum", "Diş çekimi işlemi Diş bölümümüzde yapılmaktadır. Randevu alarak gelebilirsiniz.");
        qaMap.put("dolgu yaptırmak istiyorum", "Diş dolgusu işlemi Diş bölümümüzde yapılmaktadır. Randevu almanız yeterlidir.");
        qaMap.put("diş temizliği yaptırmak istiyorum", "Diş taşı temizliği işlemi Diş bölümümüzde yapılmaktadır. Randevu alarak gelebilirsiniz.");
        qaMap.put("diş beyazlatma yapılıyor mu", "Evet, Diş bölümümüzde profesyonel diş beyazlatma hizmeti verilmektedir.");

        qaMap.put("kulağım ağrıyor", "Kulak ağrısı kulak iltihabı (otit), dış kulak yolu enfeksiyonu veya boğaz problemlerinden kaynaklanabilir. KBB bölümümüzden randevu almanızı öneriyoruz.");
        qaMap.put("kulağımda çınlama var", "Kulak çınlaması (tinnitus) kulak enfeksiyonu, stres, yüksek ses maruziyeti veya iç kulak problemlerinden kaynaklanabilir. KBB bölümümüzden muayene olabilirsiniz.");
        qaMap.put("işitmekte zorlanıyorum", "İşitme kaybı kulak kiri birikimi, enfeksiyon veya yaşa bağlı işitme kaybından kaynaklanabilir. KBB bölümümüzden işitme testi yaptırabilirsiniz.");
        qaMap.put("boğazım ağrıyor", "Boğaz ağrısı tonsillit, farenjit veya viral enfeksiyondan kaynaklanabilir. KBB bölümümüzden muayene olmanızı öneriyoruz.");
        qaMap.put("yutkunmakta zorlanıyorum", "Yutma güçlüğü boğaz iltihabı, reflü veya bademcik problemlerinden kaynaklanabilir. KBB bölümümüzden randevu almanızı öneriyoruz.");
        qaMap.put("burun tıkanıklığım var", "Burun tıkanıklığı sinüzit, alerjik rinit, burun eti büyümesi veya septum deviasyonundan kaynaklanabilir. KBB bölümümüzden muayene olabilirsiniz.");
        qaMap.put("burun akıntım var", "Burun akıntısı soğuk algınlığı, sinüzit veya alerjiden kaynaklanabilir. KBB bölümümüzden tedavi olabilirsiniz.");
        qaMap.put("ses kısıklığım var", "Ses kısıklığı larenj iltihabı, ses telleri nodülü veya aşırı ses kullanımından kaynaklanabilir. KBB bölümümüzden muayene olmanızı öneriyoruz.");
        qaMap.put("baş dönmem var", "Baş dönmesi iç kulak problemleri (vertigo), tansiyon düşüklüğü veya denge bozukluğundan kaynaklanabilir. KBB bölümümüzden muayene olabilirsiniz.");
        qaMap.put("horlama sorunum var", "Horlama uyku apnesi, burun tıkanıklığı veya bademcik büyümesinden kaynaklanabilir. KBB bölümümüzde uyku testi ve tedavi yapılmaktadır.");

        qaMap.put("kalbim çarpıyor", "Kalp çarpıntısı ritim bozukluğu, anksiyete, kafein veya kalp rahatsızlığından kaynaklanabilir. Bu durum bir Kardiyoloji uzmanı tarafından değerlendirilmelidir.");
        qaMap.put("bacağım şişti", "Bacak şişliği kalp yetmezliği, böbrek problemi, damar tıkanıklığı veya lenf sistemi problemlerinden kaynaklanabilir. Bu konuda bir Kardiyoloji veya Damar Cerrahisi uzmanına başvurmanız önerilir.");
        qaMap.put("eklem ağrım var", "Eklem ağrısı artrit, romatizma, gut veya travmadan kaynaklanabilir. Bu durum bir Ortopedi veya Romatoloji uzmanı tarafından değerlendirilmelidir.");
        qaMap.put("cilt döküntüsü var", "Cilt döküntüsü alerjik reaksiyon, egzama, sedef hastalığı veya enfeksiyondan kaynaklanabilir. Bu konuda bir Dermatoloji (Cildiye) uzmanına başvurmanız önerilir.");
        qaMap.put("kaşıntım var", "Cilt kaşıntısı alerjik reaksiyon, kuru cilt, egzama veya böbrek/karaciğer problemlerinden kaynaklanabilir. Bir Dermatoloji uzmanına başvurmanız önerilir.");
        qaMap.put("baş ağrım var", "Baş ağrısı gerilim tipi baş ağrısı, migren, sinüzit veya yüksek tansiyondan kaynaklanabilir. Şiddetli ve ani baş ağrılarında Nöroloji uzmanına başvurunuz.");
        qaMap.put("sık idrara çıkıyorum", "Sık idrara çıkma idrar yolu enfeksiyonu, diyabet, prostat büyümesi veya mesane problemlerinden kaynaklanabilir. Bir Üroloji uzmanına başvurmanız önerilir.");
        qaMap.put("adet düzensizliğim var", "Adet düzensizliği hormonal dengesizlik, polikistik over sendromu veya tiroid problemlerinden kaynaklanabilir. Bu konuda bir Kadın Hastalıkları uzmanına başvurmanız önerilir.");
        qaMap.put("kilo kaybı yaşıyorum", "İstem dışı kilo kaybı tiroid hastalıkları, diyabet, depresyon veya ciddi hastalıkların belirtisi olabilir. Bir İç Hastalıkları (Dahiliye) uzmanına başvurmanız önerilir.");
        qaMap.put("saç dökülmesi var", "Saç dökülmesi stres, hormonal değişiklikler, demir eksikliği veya cilt hastalıklarından kaynaklanabilir. Bir Dermatoloji uzmanına başvurmanız önerilir.");
    }

    private Bucket createNewBucket() {
        Bandwidth limit = Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(1)));

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    @PostMapping ("/api/input")
    ChatResponse chatBotResponse(@RequestBody Map<String, String> payload, HttpServletRequest request){
        String ip = request.getRemoteAddr();

        Bucket bucket = cache.computeIfAbsent(ip, k -> createNewBucket());
        if (bucket.tryConsume(1)){

            String input = payload.get("input");

            if (input == null || input.trim().isEmpty()) {
                return new ChatResponse(
                        "Lütfen bir mesaj girin.",
                        "HATA"
                );
            }

            String contextMessage = buildContextMessage();

            List<Message> messages = new ArrayList<>();
            messages.add(new SystemMessage(contextMessage));
            messages.add(new UserMessage(input));

            String response = chatModel.call(new Prompt(messages))
                    .getResult()
                    .getOutput()
                    .getText();

            String expertise = expriement(response);
            if (expertise.equals("Bulamadım")){
                return new ChatResponse(
                        response,
                        "Bulunamadı"
                );
            }

            return new ChatResponse(
                    response,
                    expertise
            );
        }
        else {
            return new ChatResponse(
                    "Çok fazla soru sordunuz. Lütfen 1 dakika bekleyip tekrar deneyin.",
                    "SİSTEM UYARISI"
            );
        }
    }

    private String expriement(String input){
        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage("Sana verilen cümlede bir hastalık alanı bulursan onu söyle, hastalığın ne olduğunu söyleme sadece uzmanlık alanını söyle, eğer bulamazsan sadece 'Bulamadım' söyle."));
        messages.add(new UserMessage(input));

        String response = chatModel.call(new Prompt(messages))
                .getResult()
                .getOutput()
                .getText();

        return response;
    }


    private String buildContextMessage() {
        StringBuilder context = new StringBuilder();
        context.append("Sen bir klinik asistanısın. Kliniğimizde şu bölümler var: Dahiliye, Göz Hastalıkları, Diş ve Kulak Burun Boğaz (KBB).\n\n");
        context.append("GÖREVIN:\n");
        context.append("1. Kullanıcının semptomlarını dinle ve muhtemel hastalığı tespit et.\n");
        context.append("2. Eğer hastalık kliniğimizdeki bölümlerle (Dahiliye, Göz Hastalıkları, Diş, KBB) ilgiliyse, hem hastalığı söyle hem de hangi bölümden randevu alması gerektiğini belirt.\n");
        context.append("3. Eğer hastalık kliniğimizdeki bölümlerin dışındaysa (örn: Kardiyoloji, Ortopedi, Dermatoloji vb.), sadece muhtemel hastalığı ve hangi uzmana başvurması gerektiğini söyle, randevu yönlendirmesi yapma.\n");
        context.append("4. Randevu, çalışma saatleri ve genel sorular için bilgi bankasındaki bilgileri kullan.\n\n");

        context.append("ÖNEMLİ UYARILAR:\n");
        context.append("- Her zaman kibar ve profesyonel ol.\n");
        context.append("- Kesin teşhis koyma, 'olabilir', 'muhtemelen' gibi ifadeler kullan.\n");
        context.append("- Acil durumlar için hastaneye başvurmalarını söyle.\n");

        for (Map.Entry<String, String> entry : qaMap.entrySet()) {
            context.append("Soru: ").append(entry.getKey()).append("\n");
            context.append("Cevap: ").append(entry.getValue()).append("\n\n");
        }

        context.append("Kullanıcıya Türkçe, kibar ve yardımcı bir şekilde cevap ver.");

        return context.toString();
    }
}
