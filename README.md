Lumen AI is a unified AI platform that brings documents, language models, and external tools into one conversational workspace. It uses retrieval-augmented generation to provide grounded answers and supports extensible model and MCP integrations.


```
<!--  





uv run python -c 'import time, jwt; from src.core.config import get_settings; now=int(time.time()); print(jwt.encode({"sub":"user_1","iss":"rag-frontend","aud":"rag-backend","iat":now,"exp":now+604800}, get_settings().backend_jwt_secret, algorithm="HS256"))'





 -->