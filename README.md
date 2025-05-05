# Toonzy - Manga & Comics Website

## Overview
Toonzy is a responsive web application for reading manga and comics online. The platform offers a clean, intuitive interface for users to browse, search, and read comic content across various genres.

## Live Demo
[View Live Demo](https://ganesh2609.github.io/Toonzy/)

## Features
- **Responsive Design**: Fully responsive layout that works on mobile, tablet, and desktop screens
- **User Profiles**: Personal profile page with user information and settings
- **Comic Library**: Browse comics by genre, popularity, or recency
- **Daily Updates**: Track comics that update on specific days of the week
- **Reading Experience**: Smooth, vertical-scrolling reader for manga/comics
- **Search Functionality**: Find comics by title, genre, or keyword
- **Favorites System**: Save comics to a personal favorites list

## File Structure
```
Toonzy/
├── assets/
│   ├── images/
│   │   ├── icons/
│   │   │   └── [icon SVG files]
│   │   ├── chapter.jpg
│   │   ├── dr_savior.jpg
│   │   ├── dr_savior_2.jpg
│   │   ├── logo.png
│   │   ├── other_front.jpg
│   │   └── profile.png
├── css/
│   ├── normalize.css
│   └── style.css
├── js/
│   ├── main.js
│   └── pdf-viewer.js
├── comic-detail.html
├── daily.html
├── genres.html
├── index.html
├── profile.html
├── reader.html
└── README.md
```

## Pages
- **index.html**: Homepage with featured comics and latest updates
- **genres.html**: Browse comics by genre categories
- **daily.html**: View comics that update on specific days
- **comic-detail.html**: Detailed information about a specific comic
- **reader.html**: Manga/comic reading interface
- **profile.html**: User profile page

## Technologies Used
- HTML5
- CSS3
- JavaScript (ES6+)
- PDF.js for the comic reader

## Setup Instructions

### Prerequisites
- Any modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional for local development)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Ganesh2609/Toonzy.git
   ```

2. Navigate to the project directory:
   ```bash
   cd Toonzy
   ```

3. Open `index.html` in your browser or serve with a local web server.

### Development
For active development, a simple way to run a local server:

Using Python:
```bash
# Python 3
python -m http.server

# Python 2
python -m SimpleHTTPServer
```

Using Node.js:
```bash
# Install http-server globally
npm install -g http-server

# Run the server
http-server
```

## Browser Compatibility
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing
1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## License
© 2025 Toonzy. All rights reserved.

## Contact
For any inquiries, please contact [your-email@example.com]

---

Created by Madhavan R