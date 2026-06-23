import urllib.request
import uuid

url = "http://localhost:8001/api/cvs/upload"
user_id = "501438b7-6b17-4d7c-a579-83701abc5edb"
dummy_pdf_content = b"%PDF-1.4\n%mock pdf content"

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
headers = {
    'Content-Type': f'multipart/form-data; boundary={boundary}',
    'Accept': 'application/json'
}

# Construct multipart body
body_parts = []

# user_id Form field
body_parts.append(f'--{boundary}'.encode('utf-8'))
body_parts.append(b'Content-Disposition: form-data; name="user_id"')
body_parts.append(b'')
body_parts.append(user_id.encode('utf-8'))

# file Form field
body_parts.append(f'--{boundary}'.encode('utf-8'))
body_parts.append(b'Content-Disposition: form-data; name="file"; filename="test_cv.pdf"')
body_parts.append(b'Content-Type: application/pdf')
body_parts.append(b'')
body_parts.append(dummy_pdf_content)

# End boundary
body_parts.append(f'--{boundary}--'.encode('utf-8'))
body_parts.append(b'')

data = b'\r\n'.join(body_parts)

req = urllib.request.Request(url, data=data, headers=headers, method='POST')

print(f"Sending native request to {url}...")
try:
    with urllib.request.urlopen(req) as response:
        print(f"Response Code: {response.status}")
        print("Response Body:")
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Request failed: {e}")
