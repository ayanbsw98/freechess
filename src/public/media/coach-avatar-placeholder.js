// This is a placeholder for the coach avatar image
// Use a simple SVG without emoji to avoid btoa Unicode errors
const coachAvatarPlaceholder = `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <rect width="40" height="40" fill="#2c3e50"/>
  <circle cx="20" cy="16" r="8" fill="#f9ca24"/>
  <rect x="10" y="28" width="20" height="8" rx="4" fill="#f9ca24"/>
</svg>
`;

// Create an image element
const img = document.createElement('img');
img.src = 'data:image/svg+xml;base64,' + btoa(coachAvatarPlaceholder);

// When the page loads, replace the avatar with this placeholder
document.addEventListener('DOMContentLoaded', () => {
  const avatarContainer = document.querySelector('#coach-avatar');
  if (avatarContainer) {
    avatarContainer.innerHTML = '';
    avatarContainer.appendChild(img.cloneNode());
  }
});
