# 🎨 Welcome Screen Customization Guide

## Quick Customizations

### 🏷️ **Change the Welcome Message**
In `index.html`, find and edit:
```html
<h1 class="welcome-title">Welcome Viking!</h1>
```
Change "Viking" to any name you want!

### 🎨 **Change Colors (Super Easy!)**
In `styles.css`, find the `:root` section at the top and change these values:

```css
:root {
    --primary-green: #c6c922;        /* Main button color */
    --primary-green-hover: #b5b520;  /* Button hover color */
}
```

**Popular Color Themes:**
- **Blue Theme**: `--primary-green: #3b82f6; --primary-green-hover: #2563eb;`
- **Purple Theme**: `--primary-green: #8b5cf6; --primary-green-hover: #7c3aed;`
- **Red Theme**: `--primary-green: #ef4444; --primary-green-hover: #dc2626;`
- **Orange Theme**: `--primary-green: #f97316; --primary-green-hover: #ea580c;`

### 📝 **Change Button Text**
In `index.html`, find and edit the button text:
```html
<a href="#" class="action-btn">Pending Approvals</a>
<a href="#" class="action-btn">My Approvals</a>
<a href="#" class="action-btn">Medical Records Tracker</a>
<a href="#" class="action-btn">All Entries</a>
```

### 👤 **Change User Avatar**
Replace the user icon with any Font Awesome icon:
```html
<div class="user-avatar">
    <i class="fas fa-user"></i>  <!-- Change "fa-user" to any icon -->
</div>
```

**Popular Icons:**
- `fa-user-md` (doctor)
- `fa-heart` (heart)
- `fa-shield-alt` (shield)
- `fa-star` (star)
- `fa-crown` (crown)

### 🖼️ **Add Real User Photo**
Replace the icon with an actual image:
```html
<div class="user-avatar">
    <img src="profile-photo.jpg" alt="User Profile" style="width: 100%; height: 100%; border-radius: 8px; object-fit: cover;">
</div>
```

## Advanced Customizations

### 🔗 **Make Buttons Functional**
In `script.js`, find the button click handler and add real URLs:
```javascript
// Example: You could redirect to different pages or show different content
window.location.href = '/pending-approvals';
```

### 📏 **Adjust Card Size**
In `styles.css`, change the welcome card width:
```css
.welcome-card {
    width: 448px;  /* Change this value */
}
```

### 🎭 **Add More Animation**
Add entrance animations by updating the CSS:
```css
.action-btn {
    animation: slideInUp 0.6s ease-out;
    animation-delay: calc(var(--i) * 0.1s);
}
```

## 🚀 File Structure
```
website-project/
├── index.html              # Main HTML (edit content here)
├── styles.css              # All styling (edit colors here)
├── script.js               # Interactive features
├── README.md               # Technical documentation
└── CUSTOMIZATION_GUIDE.md  # This guide
```

## 💡 Pro Tips

1. **Always save files** after making changes
2. **Refresh your browser** to see updates
3. **Test on mobile** by resizing your browser window
4. **Use the browser developer tools** (F12) to experiment with styles
5. **Make backups** before major changes

## 🆘 Need Help?

- **Colors not changing?** Make sure you saved the CSS file and refreshed the browser
- **Layout broken?** Check that you didn't accidentally delete any closing tags `}`
- **Buttons not working?** Check the browser console (F12) for error messages

---
*Created for your Welcome Screen website - Keep this file handy for easy customizations!*
