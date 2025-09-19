# Highlight Workflow Testing Guide

## Prerequisites
1. Ensure the database migration has been run:
   ```sql
   -- Run database/013_update_get_bookmark_highlights_with_xpath.sql in Supabase SQL Editor
   ```

2. Have a working bookmark with extracted content in reader mode

## Test Steps

### 1. Basic Highlight Creation
1. Open a bookmark in reader mode
2. Select some text (try different lengths)
3. Verify the highlight tooltip appears
4. Choose a highlight color
5. Click "Highlight" to save
6. **Expected Result**: Highlight appears with chosen color

### 2. Highlight with Annotation
1. Select text and add an annotation in the tooltip
2. Click "Highlight & Comment"
3. **Expected Result**: Both highlight and annotation are created

### 3. Multiple Highlights
1. Create highlights with different colors
2. Create highlights by different users (if possible)
3. **Expected Result**: All highlights appear with correct colors and creator attribution

### 4. Database Verification
Check the database to ensure all fields are populated:
```sql
SELECT 
  selected_text,
  text_before,
  text_after,
  start_offset,
  end_offset,
  xpath_start,
  xpath_end,
  color,
  created_at
FROM public.highlights 
WHERE bookmark_id = 'your-bookmark-id'
ORDER BY created_at DESC;
```

### 5. Highlight Persistence
1. Create highlights
2. Refresh the page
3. Navigate away and back to the bookmark
4. **Expected Result**: Highlights persist and render correctly

### 6. Error Handling
1. Try selecting text outside the content area
2. Try creating highlight without login
3. Try with invalid data
4. **Expected Result**: Appropriate error handling

## Debugging Tips

### Check Console Logs
Look for these log messages:
- `🔍 Creating highlight with parameters:` - Shows all data being sent
- `📦 Insert data payload:` - Shows database insert data
- `✅ Highlight created successfully in database:` - Confirms success

### Common Issues
1. **Highlights not appearing**: Check if content extraction worked
2. **XPath errors**: Verify DOM structure in browser dev tools
3. **Database errors**: Check RLS policies and user permissions
4. **Color issues**: Verify color format (hex codes)

### Browser Dev Tools
1. Inspect highlight elements to verify:
   - `data-highlight-id` attribute
   - `data-color` attribute
   - CSS styling
   - Creator information in title

## Success Criteria
- ✅ Highlights are created with all required data
- ✅ XPath data is captured and stored
- ✅ Context text is captured
- ✅ Colors are applied correctly
- ✅ Creator attribution works
- ✅ Highlights persist across sessions
- ✅ Multiple highlights work correctly
- ✅ Error handling is graceful

## Performance Notes
- Highlight creation should be fast (< 1 second)
- Rendering should not block the UI
- Database queries should be efficient
- XPath generation should be lightweight

## Browser Compatibility
Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Mobile Testing
- Touch selection should work
- Tooltip positioning should be correct
- Colors should be visible on mobile screens
