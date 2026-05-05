'use client';

import { useState } from 'react';

export default function Footer() {
  const [joined, setJoined] = useState(false);

  return (
    <footer className="site">
      <div className="foot-top">
        <div className="foot-brand">
          <div className="logo">underdwag</div>
          <p>Premium streetwear built in India. New drops every season. Subscribe for early access.</p>
          <form
            className="newsletter"
            onSubmit={(e) => {
              e.preventDefault();
              setJoined(true);
              e.currentTarget.reset();
            }}
          >
            <input type="email" required placeholder="your@email.com" aria-label="Email" />
            <button type="submit">{joined ? 'Joined ✓' : 'Join'}</button>
          </form>
        </div>
        <div className="foot-col">
          <h4>Shop</h4>
          <ul>
            <li><a href="/collections">New In</a></li>
            <li><a href="/collections">T-Shirts</a></li>
            <li><a href="/collections">Hoodies</a></li>
            <li><a href="/collections">Jackets</a></li>
            <li><a href="/collections">Caps</a></li>
          </ul>
        </div>
        <div className="foot-col">
          <h4>Support</h4>
          <ul>
            <li><a href="#">Track Order</a></li>
            <li><a href="#">Returns & Exchanges</a></li>
            <li><a href="#">Shipping</a></li>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
        <div className="foot-col">
          <h4>Brand</h4>
          <ul>
            <li><a href="#">Our Story</a></li>
            <li><a href="#">Stores</a></li>
            <li><a href="#">Collaborations</a></li>
            <li><a href="#">Press</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Instagram</a></li>
          </ul>
        </div>
      </div>
      <div className="foot-bottom">
        <span>© {new Date().getFullYear()} underdwag. All rights reserved.</span>
        <span>Bengaluru · Delhi · Mumbai</span>
      </div>
    </footer>
  );
}
