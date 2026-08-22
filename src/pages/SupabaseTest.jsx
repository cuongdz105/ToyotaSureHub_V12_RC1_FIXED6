import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function SupabaseTest() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");

  const testConnection = async () => {
    setResult("Đang kết nối...");

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      setResult(`❌ Auth lỗi: ${authError.message}`);
      return;
    }

    const { data: cars, error: carsError } = await supabase
      .from("cars")
      .select("id, brand, model")
      .limit(5);

    if (carsError) {
      setResult(`❌ Database lỗi: ${carsError.message}`);
      return;
    }

    setResult(
      `✅ SUPABASE KẾT NỐI THÀNH CÔNG!\n\n` +
      `User: ${authData.user.email}\n` +
      `Cars hiện có: ${cars.length}`
    );
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Supabase V12 Test</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", marginBottom: 10, padding: 10 }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", marginBottom: 10, padding: 10 }}
      />

      <button onClick={testConnection}>
        Test Supabase
      </button>

      <pre style={{ marginTop: 20, whiteSpace: "pre-wrap" }}>
        {result}
      </pre>
    </div>
  );
}