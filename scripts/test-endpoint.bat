@echo off
echo === TEST 1: Minimal request (name + message only) ===
curl -s -X POST http://localhost:3001/notify/contact ^
  -H "Content-Type: application/json" ^
  -H "Origin: http://localhost:8080" ^
  -d "{\"name\":\"Azizxon (Minimal)\",\"message\":\"Test with no optional fields\"}" ^
  -w "\nHTTP Status: %%{http_code}\n"

echo.
echo === TEST 2: Full request (all fields) ===
curl -s -X POST http://localhost:3001/notify/contact ^
  -H "Content-Type: application/json" ^
  -H "Origin: http://localhost:8080" ^
  -d "{\"name\":\"Azizxon (Full)\",\"email\":\"azizxon@example.com\",\"telegramUsername\":\"@sagdulayev_a\",\"phone\":\"+998901234567\",\"message\":\"Test with all fields filled in\"}" ^
  -w "\nHTTP Status: %%{http_code}\n"

echo.
echo === TEST 3: Missing required fields (should return 400) ===
curl -s -X POST http://localhost:3001/notify/contact ^
  -H "Content-Type: application/json" ^
  -H "Origin: http://localhost:8080" ^
  -d "{\"email\":\"test@example.com\"}" ^
  -w "\nHTTP Status: %%{http_code}\n"

echo.
echo.
echo === TEST 4: Chat endpoint test ===
curl -s -X POST http://localhost:3001/chat ^
  -H "Content-Type: application/json" ^
  -H "Origin: http://localhost:8080" ^
  -d "{\"message\":\"Siz qaysi texnologiyalardan foydalanasiz?\"}" ^
  -w "\nHTTP Status: %%{http_code}\n"

echo.
echo === TEST 5: Health check ===
curl -s http://localhost:3001/health -w "\nHTTP Status: %%{http_code}\n"


