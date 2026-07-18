@echo off
echo === TEST 1: Valid request from localhost:8080 (should return 200) ===
curl -s -X POST http://localhost:3001/notify/contact ^
  -H "Content-Type: application/json" ^
  -H "Origin: http://localhost:8080" ^
  -d "{\"name\":\"Azizxon\",\"email\":\"test@example.com\",\"message\":\"Integration test from port 8080\"}" ^
  -w "\nHTTP Status: %%{http_code}\n"

echo.
echo === TEST 2: Missing required fields (should return 400) ===
curl -s -X POST http://localhost:3001/notify/contact ^
  -H "Content-Type: application/json" ^
  -H "Origin: http://localhost:5173" ^
  -d "{\"email\":\"test@example.com\"}" ^
  -w "\nHTTP Status: %%{http_code}\n"

echo.
echo === TEST 3: Blocked origin (should return CORS error) ===
curl -s -X POST http://localhost:3001/notify/contact ^
  -H "Content-Type: application/json" ^
  -H "Origin: http://evil-site.com" ^
  -d "{\"name\":\"Hacker\",\"message\":\"Spam\"}" ^
  -w "\nHTTP Status: %%{http_code}\n"

echo.
echo === TEST 4: Health check ===
curl -s http://localhost:3001/health -w "\nHTTP Status: %%{http_code}\n"
