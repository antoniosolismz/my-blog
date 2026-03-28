/**
 * ctOS 2.0 - Enhanced Interactive Effects
 * Watch Dogs inspired dynamic elements
 */

(function() {
  'use strict';

  // Initialize on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    addSystemBoot();
    addDataCorruption();
    addHUDElements();
    addMouseTracker();
  }

  /**
   * System boot sequence animation
   */
  function addSystemBoot() {
    const bootSequence = [
      'INITIALIZING CTOS 2.0...',
      'LOADING SYSTEM MODULES...',
      'ESTABLISHING SECURE CONNECTION...',
      'ACCESS GRANTED'
    ];

    // Check if we should show boot (first visit or refresh)
    const hasBooted = sessionStorage.getItem('ctos_booted');
    
    if (!hasBooted) {
      const overlay = document.createElement('div');
      overlay.id = 'boot-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #000;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Consolas', monospace;
        color: #FF6B35;
        font-size: 1.2rem;
        letter-spacing: 2px;
      `;

      const text = document.createElement('div');
      text.style.cssText = `
        text-align: center;
        text-shadow: 0 0 10px rgba(255, 107, 53, 0.5);
      `;
      overlay.appendChild(text);
      document.body.appendChild(overlay);

      let currentLine = 0;
      const interval = setInterval(() => {
        if (currentLine < bootSequence.length) {
          text.innerHTML += bootSequence[currentLine] + '<br>';
          currentLine++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.5s';
            setTimeout(() => overlay.remove(), 500);
          }, 500);
          sessionStorage.setItem('ctos_booted', 'true');
        }
      }, 400);
    }
  }

  /**
   * Random data corruption effect on text
   */
  function addDataCorruption() {
    const glitchChars = '01█▓▒░!@#$%^&*';
    
    setInterval(() => {
      // Random chance to glitch a heading
      if (Math.random() > 0.95) {
        const headings = document.querySelectorAll('h1, h2, h3');
        if (headings.length === 0) return;
        
        const target = headings[Math.floor(Math.random() * headings.length)];
        const originalText = target.textContent;
        const textLength = originalText.length;
        
        // Create corrupted version
        let corrupted = '';
        for (let i = 0; i < textLength; i++) {
          corrupted += Math.random() > 0.7 
            ? glitchChars[Math.floor(Math.random() * glitchChars.length)]
            : originalText[i];
        }
        
        target.textContent = corrupted;
        
        // Restore after brief moment
        setTimeout(() => {
          target.textContent = originalText;
        }, 50);
      }
    }, 2000);
  }

  /**
   * Add HUD-style corner elements
   */
  function addHUDElements() {
    const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    
    corners.forEach(corner => {
      const element = document.createElement('div');
      element.className = `hud-corner hud-${corner}`;
      element.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        border-color: #FF6B35;
        opacity: 0.3;
        pointer-events: none;
        z-index: 9997;
      `;
      
      switch(corner) {
        case 'top-left':
          element.style.top = '10px';
          element.style.left = '10px';
          element.style.borderTop = '2px solid';
          element.style.borderLeft = '2px solid';
          break;
        case 'top-right':
          element.style.top = '10px';
          element.style.right = '10px';
          element.style.borderTop = '2px solid';
          element.style.borderRight = '2px solid';
          break;
        case 'bottom-left':
          element.style.bottom = '10px';
          element.style.left = '10px';
          element.style.borderBottom = '2px solid';
          element.style.borderLeft = '2px solid';
          break;
        case 'bottom-right':
          element.style.bottom = '10px';
          element.style.right = '10px';
          element.style.borderBottom = '2px solid';
          element.style.borderRight = '2px solid';
          break;
      }
      
      document.body.appendChild(element);
    });

    // Add status indicator
    const status = document.createElement('div');
    status.style.cssText = `
      position: fixed;
      top: 15px;
      right: 50px;
      font-family: 'Consolas', monospace;
      font-size: 0.7rem;
      color: #FF6B35;
      letter-spacing: 1px;
      pointer-events: none;
      z-index: 9997;
      opacity: 0.5;
    `;
    
    // Update time every second
    function updateStatus() {
      const now = new Date();
      status.textContent = `[CTOS] ${now.toLocaleTimeString('en-US', { hour12: false })}`;
    }
    updateStatus();
    setInterval(updateStatus, 1000);
    
    document.body.appendChild(status);
  }

  /**
   * Mouse position tracker (subtle effect)
   */
  function addMouseTracker() {
    const tracker = document.createElement('div');
    tracker.style.cssText = `
      position: fixed;
      width: 6px;
      height: 6px;
      background: #FF6B35;
      border-radius: 50%;
      pointer-events: none;
      z-index: 99998;
      opacity: 0;
      transition: opacity 0.3s;
      box-shadow: 0 0 10px rgba(255, 107, 53, 0.8);
    `;
    document.body.appendChild(tracker);

    let mouseX = 0;
    let mouseY = 0;
    let trackerX = 0;
    let trackerY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      tracker.style.opacity = '0.6';
    });

    // Smooth follow animation
    function animate() {
      trackerX += (mouseX - trackerX) * 0.1;
      trackerY += (mouseY - trackerY) * 0.1;
      
      tracker.style.left = trackerX + 'px';
      tracker.style.top = trackerY + 'px';
      
      requestAnimationFrame(animate);
    }
    animate();
  }

})();
