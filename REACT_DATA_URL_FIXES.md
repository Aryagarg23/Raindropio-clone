# React Warning and Data URL Fixes

## Issues Resolved

### 1. React Warning: `ordered` Attribute
**Error**: 
```
Received `false` for a non-boolean attribute `ordered`.
If you want to write it to the DOM, pass a string instead: ordered="false" or ordered={value.toString()}.
```

**Root Cause**: ReactMarkdown was passing an `ordered` prop to the `<ol>` component, which is not a valid HTML attribute.

**Solution**: Filter out the `ordered` prop in the ReactMarkdown component renderer.

**File**: `frontend/components/team-site/bookmarks/modal-parts/ImprovedReaderView.tsx`

**Before**:
```tsx
ol: (props: any) => {
  const { node, ...cleanProps } = props
  return (
    <ol {...cleanProps} className="list-decimal list-inside mb-4 space-y-1">
      {props.children}
    </ol>
  )
},
```

**After**:
```tsx
ol: (props: any) => {
  const { node, ordered, ...cleanProps } = props
  return (
    <ol {...cleanProps} className="list-decimal list-inside mb-4 space-y-1">
      {props.children}
    </ol>
  )
},
```

### 2. Data URLs Being Proxied
**Error**: 
```
GET /content/proxy/image?url=data%3Aimage%2Fgif%3Bbase64%2CR0lGODlhAQABAIAAAAAAAP%2F%2F%2FywAAAAAAQABAAACAUwAOw%3D%3D 404 in 212ms
```

**Root Cause**: Data URLs (like `data:image/gif;base64,...`) were being sent to the proxy endpoint, which is unnecessary and causes errors.

**Solutions Implemented**:

#### Backend: Skip Data URLs in Content Processing
**File**: `backend/services/content_extraction_service.py`

Added logic to skip data URLs during content processing:

```python
# Skip data URLs - they don't need proxying
if src.startswith('data:'):
    img['loading'] = 'lazy'
    img['decoding'] = 'async'
    continue
```

#### Backend: Reject Data URLs in Proxy Endpoint
**File**: `backend/api/routers/content.py`

Added validation to reject data URLs at the proxy endpoint:

```python
@router.get("/proxy/image")
async def proxy_image(url: str):
    # Skip data URLs - they don't need proxying
    if url.startswith('data:'):
        raise HTTPException(status_code=400, detail="Data URLs do not need proxying")
```

## Testing Results

### ✅ React Warning Fixed
- No more `ordered` attribute warnings in console
- Ordered lists still render correctly with proper styling

### ✅ Data URL Handling Fixed
**Test 1 - Data URL Rejection**:
```bash
curl -X GET "http://localhost:8000/content/proxy/image?url=data%3Aimage%2Fgif%3Bbase64%2C..." -I
# Result: HTTP/1.1 400 Bad Request
```

**Test 2 - Regular Images Still Work**:
```bash
curl -X GET "http://localhost:8000/content/proxy/image?url=https%3A%2F%2Fichef.bbci.co.uk%2Fnews%2F..." -I
# Result: HTTP/1.1 200 OK
# content-type: image/webp
```

## Benefits

### 1. **Cleaner Console Output**
- No more React warnings about invalid attributes
- No more 404 errors for data URLs

### 2. **Better Performance**
- Data URLs are no longer unnecessarily proxied
- Reduced server load from invalid requests

### 3. **Improved User Experience**
- Data URLs (like placeholder images) load directly without proxy overhead
- Regular images still work through the proxy for CORS handling

### 4. **Proper Error Handling**
- Clear error messages for invalid proxy requests
- Graceful handling of different URL types

## Technical Details

### Data URL Types Handled
- `data:image/gif;base64,...` - Base64 encoded images
- `data:image/svg+xml;base64,...` - SVG images
- `data:image/png;base64,...` - PNG images
- Any other `data:` URLs

### ReactMarkdown Props Filtering
The fix ensures that only valid HTML attributes are passed to DOM elements:
- `node` - Internal ReactMarkdown prop (filtered out)
- `ordered` - ReactMarkdown prop for ordered lists (filtered out)
- Standard HTML attributes - Passed through normally

## Impact

- **Frontend**: Cleaner console output, no React warnings
- **Backend**: Proper handling of different URL types
- **Performance**: Reduced unnecessary proxy requests
- **User Experience**: Faster loading of data URLs, reliable image proxying

Both issues have been completely resolved, resulting in a cleaner and more efficient image handling system.
