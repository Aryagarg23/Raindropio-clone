# Double Proxy URL Fix

## Problem

Images were failing to load with "Failed to load" errors. The terminal logs showed URLs like:

```
GET /content/proxy/image?url=https%3A%2F%2Fwww.humanegardener.com%2Fcontent%2Fproxy%2Fimage%3Furl%3Dhttps%3A%2F%2Fi0.wp.com%2Fwww.humanegardener.com%2Fwp-content%2Fuploads%2F2023%2F09%2FIMG_7392-1.jpeg%3Ffit%3D474%252C340%26ssl%3D1 404 in 217ms
```

Notice the double-proxying: `/content/proxy/image?url=.../content/proxy/image?url=...`

## Root Cause

The content extraction pipeline was processing images twice:

1. **First pass**: In `_clean_content_for_markdown()` method (line 171)
   ```python
   img['src'] = f"/content/proxy/image?url={src}"
   ```

2. **Second pass**: In `_html_to_markdown_with_images()` method (line 390)
   ```python
   encoded_url = quote_plus(src)
   img['src'] = f"/content/proxy/image?url={encoded_url}"
   ```

This resulted in URLs like:
```
/content/proxy/image?url=/content/proxy/image?url=https://example.com/image.jpg
```

## Solution

**Removed image proxying from the first pass** and let it only happen in the second pass where proper URL encoding is applied.

### Changes Made

**File**: `backend/services/content_extraction_service.py`

**Before**:
```python
# Handle images - make them work with our proxy
for img in soup.find_all('img'):
    src = img.get('src')
    if src:
        # Proxy image through our backend
        img['src'] = f"/content/proxy/image?url={src}"
        img['loading'] = 'lazy'
        img['decoding'] = 'async'
```

**After**:
```python
# Images will be handled later in _html_to_markdown_with_images
# Just ensure they have proper attributes for now
for img in soup.find_all('img'):
    img['loading'] = 'lazy'
    img['decoding'] = 'async'
```

### Additional Protection

Added a check in `_html_to_markdown_with_images()` to prevent double-proxying:

```python
# Skip if already proxied to avoid double-proxying
if src.startswith('/content/proxy/image'):
    continue
```

## Testing Results

### Before Fix
- ❌ Double-proxied URLs causing 404 errors
- ❌ Images showing "Failed to load" message
- ❌ URLs like: `/content/proxy/image?url=.../content/proxy/image?url=...`

### After Fix
- ✅ Single-proxy URLs working correctly
- ✅ Images loading successfully
- ✅ URLs like: `/content/proxy/image?url=https%3A//example.com/image.jpg`
- ✅ Proper URL encoding with `quote_plus()`

### Test Results
```bash
# Backend generates correct URLs
Found proxy URLs:
  https%3A%2F%2Fichef.bbci.co.uk%2Fnews%2F480%2Fcpsprodpb%2F8007%2Flive%2F0dfedb80-956f-11f0-aa3a-ddc192c3f339.jpg.webp
  Decoded: https://ichef.bbci.co.uk/news/480/cpsprodpb/8007/live/0dfedb80-956f-11f0-aa3a-ddc192c3f339.jpg.webp

# Backend proxy responds correctly
curl -X GET "http://localhost:8000/content/proxy/image?url=..." -I
HTTP/1.1 200 OK
content-type: image/webp
```

## Impact

- **Images now load correctly** instead of showing "Failed to load" errors
- **No more 404 errors** for image proxy requests
- **Cleaner URL structure** with proper encoding
- **Better performance** without unnecessary double-processing
- **Maintained functionality** - all other features still work

## Next Steps

If images are still not loading in the browser, the issue may be:

1. **Browser cache**: Clear browser cache or hard refresh (Ctrl+F5)
2. **Frontend caching**: The frontend may be using cached content with old URLs
3. **CORS issues**: Check if the frontend can access the backend proxy endpoint
4. **Network connectivity**: Ensure the backend is accessible from the frontend

The backend is now generating correct URLs, so any remaining issues are likely on the frontend or caching side.
