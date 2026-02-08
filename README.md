# Road Rash 3D

A modern WebGL-based 3D remake of the legendary Road Rash motorcycle racing game from the DOS era. Race against 7 AI opponents across a vibrant 3D city environment, use combat moves to knock off rivals, and achieve victory by finishing in the top 3!

## Features

### Core Gameplay
- **3D Racing Experience** - Full 3D perspective rendered with WebGL and Three.js
- **7 AI Opponents** - Intelligent opponents with individual lap speeds and lane-changing behavior
- **Combat Attacks** - Left and right punch attacks to damage and eliminate rivals
- **Health System** - Track your bike's condition with a real-time health bar
- **8000m Race Distance** - Complete the full race to claim victory
- **Win Condition** - Finish in the top 3 positions to win

### Graphics & Environment
- **3D Street Racing** - Realistic perspective-based road rendering with lane markings
- **Detailed Motorcycles** - Custom 3D bike models with tinted visors, fairings, suspension, and realistic wheels
- **Dynamic City** - 30+ colorful buildings with windows on both sides of the road
- **Scenic Details** - 25 decorative trees and 15 street lamp poles lining the race course
- **Lighting & Shadows** - Full dynamic shadows and directional lighting for immersive visuals
- **Textured Road** - High-quality road surface with yellow center lines and white lane dividers

### Game Mechanics
- **Smooth Physics** - Velocity-based movement with realistic acceleration and friction
- **Lane Navigation** - Switch between 3 racing lanes to evade opponents
- **Speed Management** - Health affects maximum speed; damaged bikes are slower
- **HUD Display** - Real-time stats showing position, speed, health, and distance

## Controls

| Key | Action |
|-----|--------|
| **↑** | Accelerate |
| **↓** | Brake |
| **←** | Change Left Lane |
| **→** | Change Right Lane |
| **Z** | Punch Left |
| **X** | Punch Right |
| **SPACE** | Start Race / Restart |

## How to Play

1. **Start the Game** - Click "START RACE" or press Space
2. **Accelerate** - Press Arrow Up to build speed
3. **Navigate Lanes** - Use Left/Right arrows to dodge opponents
4. **Attack Rivals** - Press Z or X to punch left or right and damage opponent bikes
5. **Reach the Goal** - Drive 8000 meters to complete the race
6. **Achieve Victory** - Finish in the top 3 positions to win

## Running Locally

### Requirements
- Git
- Node.js 14+ (optional, for local development)
- Python 3 (for simple HTTP server)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/roadrash.git
   cd roadrash
   ```

2. Start a local HTTP server:
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Or using Node.js http-server
   npx http-server -p 8000
   ```

3. Open in your browser:
   ```
   http://localhost:8000
   ```

## Deployment to Vercel

### Option 1: Deploy with Git (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/roadrash.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Select your `roadrash` repository
   - Click "Import"

3. **Configure Project**
   - Framework: Select "Other" (static site)
   - Root Directory: Leave as `.`
   - Build Command: Leave empty
   - Output Directory: Leave empty
   - Environment Variables: None needed

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically deploy your game
   - You'll get a live URL (e.g., `https://roadrash.vercel.app`)

### Option 2: Deploy with Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Follow the prompts**
   - Confirm project directory
   - Link to existing project or create new
   - Accept defaults for production deployment

4. **Get Live URL**
   - Vercel will provide your deployment URL
   - Your game is now live!

### Option 3: Deploy via Drag & Drop

1. Go to [vercel.com/new](https://vercel.com/new)
2. Select "Other" → "CLI"
3. Or simply drag the entire project folder to upload

## After Deployment

- **Custom Domain**: Add your domain in Vercel project settings
- **Analytics**: Monitor usage in Vercel dashboard
- **Environment**: Game works in all modern browsers with WebGL support
- **Performance**: Automatically optimized with Vercel's edge network

## Vercel Project Setup (vercel.json)

Optional: Create a `vercel.json` file for advanced configuration:

```json
{
  "buildCommand": "",
  "outputDirectory": ".",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- All modern mobile browsers with WebGL support

## Troubleshooting

**Game doesn't load on mobile?**
- Ensure WebGL is enabled in browser settings
- Test on a device with dedicated GPU or modern integrated graphics

**Performance issues?**
- Reduce browser tab count for better performance
- Vercel serves from multiple regions automatically

**Deployment failed?**
- Check that all files are committed: `index.html`, `styles.css`, `game.js`
- Ensure no secrets or API keys in code
- Visit [vercel.com/docs](https://vercel.com/docs) for help

## Technical Details

- **3D Engine**: Three.js (loaded via CDN)
- **No Build Step Required**: Deploy as static files
- **File Size**: ~20KB (game.js + HTML + CSS)
- **Dependencies**: Loaded from Three.js CDN (no npm packages)

## License

MIT License - See LICENSE file for details

## Credits

Inspired by the classic Road Rash series. Modern 3D web implementation using Three.js WebGL.

---

**Enjoy the race! 🏍️**
