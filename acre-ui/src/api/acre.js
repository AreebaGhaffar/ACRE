import axios from "axios";

const API = axios.create({ baseURL: "http://127.0.0.1:8000" });

export const ingestDocument = (source, text) =>
  API.post("/ingest", { source, text }).then((r) => r.data);

export const runQuery = (query) =>
  API.post("/query", { query }).then((r) => r.data);

export const getGraphStats = () =>
  API.get("/graph/stats").then((r) => r.data);