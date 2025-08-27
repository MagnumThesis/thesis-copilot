# AI Reference Searcher Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the AI Reference Searcher feature.

## Common Issues and Solutions

### 1. Search Returns No Results

**Symptoms**: Search completes but shows "No results found"

**Possible Causes and Solutions**:
- **Query too specific**: Try broadening your search terms or using more general academic language
- **Content extraction issues**: If using content-based search, verify the selected content contains sufficient academic terms
- **Google Scholar limitations**: Google Scholar may not have results for very niche topics

**Troubleshooting Steps**:
1. Try a simpler query like "machine learning" or "artificial intelligence"
2. Check that your content selection contains relevant keywords
3. Use the query refinement feature to get suggestions for better queries

### 2. Search Fails or Returns Errors

**Symptoms**: Error messages like "Search failed" or "Rate limit exceeded"

**Possible Causes and Solutions**:
- **Rate limiting**: You've exceeded the search quota (8 requests/minute, 80/hour)
- **Network issues**: Internet connection problems
- **Google Scholar blocking**: Temporary IP blocking by Google Scholar
- **Service unavailability**: Google Scholar may be temporarily down

**Troubleshooting Steps**:
1. Wait a few minutes and try again (rate limit reset)
2. Check your internet connection
3. Try searching for a simple term like "test"
4. If issues persist, try again in 1-2 hours

### 3. Slow Search Performance

**Symptoms**: Searches take longer than expected to complete

**Possible Causes and Solutions**:
- **Complex queries**: Queries with many terms or operators may take longer
- **Large result sets**: Google Scholar returning many results
- **Network latency**: Slow internet connection
- **System resources**: Low memory or CPU on your device

**Troubleshooting Steps**:
1. Simplify your search query
2. Add filters to limit results (date range, minimum citations)
3. Check your internet speed
4. Close other resource-intensive applications

### 4. References Not Adding to Library

**Symptoms**: Clicking "Add Reference" fails or reference doesn't appear in library

**Possible Causes and Solutions**:
- **Validation errors**: Missing required fields (title, authors)
- **Duplicate detection**: System detecting existing reference
- **Network issues**: API call failing
- **Database errors**: Issues with reference storage

**Troubleshooting Steps**:
1. Check browser console for error messages (F12 Developer Tools)
2. Verify all required fields are present in search result
3. Check if reference already exists in your library
4. Try adding manually through the reference form

### 5. Content Extraction Failures

**Symptoms**: "Show Content Selection" shows no content or errors

**Possible Causes and Solutions**:
- **No content available**: Selected Ideas/Builder sections are empty
- **Content format issues**: Content in unexpected format
- **API errors**: Issues retrieving content from backend

**Troubleshooting Steps**:
1. Verify you have content in Ideas or Builder tools
2. Try selecting different content sections
3. Refresh the page and try again
4. Check if other features work (Ideas, Builder)

### 6. Query Generation Issues

**Symptoms**: Generated queries seem irrelevant or too broad

**Possible Causes and Solutions**:
- **Insufficient content**: Selected content lacks academic keywords
- **Content quality**: Content too short or generic
- **Algorithm limitations**: Query generation may miss context

**Troubleshooting Steps**:
1. Select more detailed or academic content
2. Review and manually edit generated queries
3. Use query refinement to get alternative suggestions
4. Provide feedback to improve future query generation

## Advanced Troubleshooting

### Checking Browser Console
1. Press F12 to open Developer Tools
2. Go to the "Console" tab
3. Look for error messages in red
4. Copy any error messages for support requests

### Clearing Cache
If experiencing persistent issues:
1. Close the application
2. Clear browser cache and cookies
3. Restart the application
4. Try the operation again

### Testing Network Connectivity
To verify Google Scholar accessibility:
1. Visit https://scholar.google.com in your browser
2. Try a simple search manually
3. If that fails, the issue is with your network or Google Scholar

## Error Codes and Messages

### Rate Limit Errors
- **"Rate limit exceeded"**: Wait 1-5 minutes before trying again
- **"Blocked until [time]"**: Temporary IP block, try again later

### Network Errors
- **"Network error"**: Check internet connection
- **"Timeout"**: Server took too long to respond, try again

### Parsing Errors
- **"Failed to parse search results"**: Google Scholar format may have changed
- **"Invalid HTML content"**: Unexpected response format

### Service Errors
- **"Service unavailable"**: Google Scholar is temporarily down
- **"Search failed after [n] attempts"**: Persistent service issues

## Performance Monitoring

### Checking System Performance
1. Open Task Manager (Ctrl+Shift+Esc)
2. Check CPU and memory usage
3. Close unnecessary applications if resources are high

### Monitoring Search Performance
The system tracks performance metrics:
1. Go to Search Analytics in the Reference Manager
2. Review search timing and success rates
3. Look for patterns in slow or failing searches

## Privacy and Data Issues

### Search History Not Clearing
1. Go to Privacy controls in the AI Searcher
2. Click "Clear Search History"
3. Confirm the action
4. Refresh the page

### Data Export Issues
1. Ensure you have sufficient disk space
2. Try exporting in a different format (JSON vs CSV)
3. Check browser download settings

## Contacting Support

If you continue to experience issues:

1. **Gather Information**:
   - Exact error messages
   - Steps to reproduce the issue
   - Browser and operating system
   - Screenshots if helpful

2. **Check Known Issues**:
   - Visit the GitHub issues page
   - Search for similar reported issues

3. **Report New Issues**:
   - Create a new issue on GitHub
   - Include all relevant information
   - Be as detailed as possible

## System Requirements

### Minimum Requirements
- Modern browser (Chrome, Firefox, Edge, Safari)
- Stable internet connection
- 500MB available disk space
- 2GB RAM

### Recommended Requirements
- Latest browser version
- High-speed internet connection
- 1GB available disk space
- 4GB RAM

## Browser Compatibility

### Supported Browsers
- Chrome (latest version)
- Firefox (latest version)
- Edge (latest version)
- Safari (latest version)

### Known Issues
- Internet Explorer is not supported
- Some features may not work in older browser versions

## Network Requirements

### Firewall/Proxy Settings
If behind a corporate firewall:
- Ensure access to scholar.google.com
- Allow outgoing HTTPS (port 443) connections
- Configure proxy settings if required

### Bandwidth Requirements
- Minimum: 1 Mbps download
- Recommended: 10 Mbps download
- Search results typically use 100KB-1MB per request

## Privacy and Security

### Data Storage
- Search queries and results are stored locally
- Analytics data is stored securely
- No personal information is shared without consent

### Data Retention
- Search history is kept until manually cleared
- Analytics data is retained for performance improvement
- All data can be exported or deleted at any time

## Updates and Maintenance

### Automatic Updates
- The system automatically checks for updates
- New features and bug fixes are applied automatically
- Major updates may require manual installation

### Manual Updates
To force a refresh:
1. Press Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Restart the application

## Feature Requests and Feedback

### Submitting Ideas
1. Visit the GitHub issues page
2. Create a new issue with the "enhancement" label
3. Describe your suggested feature
4. Explain how it would improve the system

### Providing Feedback
1. Use the feedback forms in the AI Searcher
2. Rate search results and overall experience
3. Provide detailed comments when helpful
4. Your feedback directly influences future development