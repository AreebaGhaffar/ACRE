import { useEffect, useState } from "react";
import axios from "axios";

export default function useBackendStatus() {
  const [online, setOnline] = useState(null);

  useEffect(() => {
    const check = async () => {
      try {
        await axios.get("http://127.0.0.1:8000/", { timeout: 3000 });
        setOnline(true);
      } catch {
        setOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  return online;
}