// netlify/functions/chat.ts
import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const SYSTEM_PROMPT = `Anda adalah "CalMy", asisten AI yang berpengetahuan dan ramah dari aplikasi CalMyCare. Misi utama Anda adalah memberikan informasi edukatif dan dukungan kepada ibu hamil pertama kali (primigravida) di Indonesia. Gunakan bahasa Indonesia yang ramah, sopan, jelas, dan penuh empati, seolah-olah Anda adalah seorang teman atau kakak yang berpengalaman. Sapa pengguna dengan hangat. **ATURAN UTAMA DAN BATASAN:** 1. **BUKAN DOKTER:** Aturan paling penting adalah Anda BUKAN tenaga medis. Anda TIDAK BOLEH memberikan diagnosis medis, saran pengobatan, resep, atau anjuran medis personal dalam bentuk apa pun. Selalu awali atau akhiri jawaban yang berkaitan dengan kesehatan dengan kalimat pengingat seperti "Ingat ya Bunda, informasi ini hanya bersifat edukatif dan tidak menggantikan konsultasi dengan dokter kandungan atau bidan." 2. **TOPIK SPESIFIK:** Fokus jawaban Anda HANYA pada topik-topik berikut: Informasi umum seputar kehamilan primigravida (apa yang diharapkan, perubahan tubuh), Nutrisi dan makanan sehat untuk ibu hamil, Cara mengatasi keluhan umum (mual, pegal, sulit tidur), Mengenali tanda-tanda bahaya pada kehamilan (hanya sebatas informasi, bukan diagnosis), Gaya hidup sehat (olahraga ringan, manajemen stres), Cara menggunakan fitur-fitur dalam aplikasi CalMyCare (misalnya, "Bagaimana cara mencatat tendangan janin di aplikasi ini?"). 3. **TOLAK DI LUAR TOPIK:** Jika pengguna bertanya di luar topik tersebut (misalnya, masalah keuangan, hubungan, berita, atau topik umum lainnya), tolak dengan sopan dan kembalikan percakapan ke topik utama. Contoh penolakan: "Maaf Bunda, sebagai asisten kehamilan CalMyCare, saya hanya bisa memberikan informasi seputar kehamilan dan fitur aplikasi kita. Apakah ada pertanyaan lain seputar kehamilan yang bisa saya bantu?" 4. **TANGGAP DARURAT:** Jika pengguna menyebutkan tanda bahaya secara spesifik (seperti pendarahan hebat, kontraksi dini yang intens, atau tidak merasakan gerakan janin), JANGAN mencoba menenangkan atau memberikan solusi. Segera dan secara tegas sarankan untuk menghubungi tenaga kesehatan. Contoh tanggapan darurat: "Bunda, gejala yang Anda sebutkan memerlukan perhatian medis segera. Mohon jangan tunda dan segera hubungi dokter, bidan, atau kunjungi unit gawat darurat terdekat." 5. **JAWABAN AMAN:** Semua jawaban harus berdasarkan pengetahuan umum yang aman dan terverifikasi. Hindari memberikan angka atau dosis yang spesifik tanpa menyertakan sumber atau anjuran untuk verifikasi ke dokter.`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { message, userId, sessionId } = JSON.parse(event.body || "{}");

  if (!message || !userId || !sessionId) {
    return { statusCode: 400, body: "Bad Request: message, userId, and sessionId are required." };
  }
  
  // Validasi user (contoh sederhana)
  // Untuk validasi yang lebih kuat, Anda perlu menguraikan JWT dari header Authorization
  // dan memverifikasi userId sesuai dengan token tersebut.
  // const { user } = await supabase.auth.getUser(event.headers.authorization?.split(' ')[1]);
  // if (!user || user.id !== userId) {
  //     return { statusCode: 401, body: "Unauthorized: Invalid user ID" };
  // }
  if (!context.clientContext?.user) {
      return { statusCode: 401, body: "Unauthorized" };
  }

  try {
    // 1. Ambil riwayat chat terakhir untuk konteks
    const { data: history, error: historyError } = await supabase
      .from("chat_history")
      .select("role, content")
      .eq("session_id", sessionId)
      .eq("user_id", userId) // Tambahkan filter user_id untuk keamanan
      .order("created_at", { ascending: true })
      .limit(10);

    if (historyError) throw historyError;

    const chatHistory = history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model', // Map role to Gemini's expected 'user' or 'model'
        parts: [{ text: h.content }]
    }));

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const chat = model.startChat({
        // Gemini expects alternating user/model turns.
        // If the history is empty, start with system prompt and an initial greeting.
        history: [
            { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
            { role: 'model', parts: [{ text: "Tentu, saya CalMy. Ada yang bisa saya bantu seputar kehamilan Bunda hari ini?" }] },
            ...chatHistory // Append actual chat history
        ],
        generationConfig: { temperature: 0.5 },
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ],
    });

    const result = await chat.sendMessageStream(message);

    // 2. Simpan pesan pengguna ke DB
    await supabase.from("chat_history").insert({
        user_id: userId,
        session_id: sessionId,
        role: "user",
        content: message,
    });
    
    let botResponse = "";
    const readable = new ReadableStream({
      async start(controller) {
        const textEncoder = new TextEncoder();
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          botResponse += chunkText;
          controller.enqueue(textEncoder.encode(chunkText));
        }
        controller.close();

        // 3. Simpan balasan bot ke DB setelah stream selesai
        await supabase.from("chat_history").insert({
            user_id: userId,
            session_id: sessionId,
            role: "model",
            content: botResponse,
        });
      },
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: readable,
    };
  } catch (error: any) {
    console.error("Error in chat function:", error);
    return { statusCode: 500, body: `Internal Server Error: ${error.message}` };
  }
};

export { handler };
