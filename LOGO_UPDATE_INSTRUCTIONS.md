# MCD ADMIN Logo Update Instructions

## Current Status
- The milescd.co.uk website is currently experiencing database connection issues
- A temporary text-based "MCD" logo has been implemented
- The system branding has been updated to "MCD ADMIN"

## To Update with Actual Logo

### When milescd.co.uk is accessible:
1. Download the official Miles Car Delivery logo
2. Save it in the `frontend/public/` directory as `mcd-logo.png`
3. Update the logo component in `App.js`:

Replace the current logo box:
```jsx
<Box sx={{ /* current styling */ }}>
  <Typography sx={{ /* MCD text */ }}>MCD</Typography>
</Box>
```

With:
```jsx
<Box sx={{ /* current styling */ }}>
  <img 
    src="/mcd-logo.png" 
    alt="MCD Logo" 
    style={{ 
      width: '32px', 
      height: '32px', 
      objectFit: 'contain' 
    }} 
  />
</Box>
```

### Favicon Update:
1. Create a favicon from the logo using favicon.ico generator
2. Replace `frontend/public/favicon.ico` with the new favicon

## Current Branding Applied:
- ✅ System name: "MCD ADMIN"
- ✅ Subtitle: "Miles Car Delivery Administration"
- ✅ Version: "Admin v1.0"
- ✅ Green theme color: #00ff88
- ✅ Meta tags updated
- ✅ Document title set to "MCD ADMIN"

## Color Scheme:
- Primary Green: #00ff88
- Secondary Green: #88ff00
- Dark Background: #0a0a0a
- Text on Green: Black for better contrast
