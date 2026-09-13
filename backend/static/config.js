// Fill these in before testing

const SUPABASE_URL = "https://fbzpnnuaamdxmhzsxosn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZienBubnVhYW1keG1oenN4b3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5OTUzNDMsImV4cCI6MjEwMzU3MTM0M30.9gy1_TuXMrz8DOr32xrvK0M1-OiQcQN7a8swqQHUN2g";

const API_BASE_URL = (typeof window !== "undefined" && window.location.origin && !window.location.origin.includes("localhost") && !window.location.origin.includes("127.0.0.1"))
  ? window.location.origin 
  : "http://127.0.0.1:8002";