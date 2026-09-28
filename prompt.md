# Premium Interactive Wedding Invitation Website

## Project Overview

Create a **premium, minimal, romantic and cinematic digital wedding invitation website**.

Use the provided reference website only to understand the general concept and type of experience:

**Reference:** https://shagun-amay-wedding.vercel.app/

**Important:** Do NOT copy the reference website's layout, text, animations, colors, illustrations, structure, or visual design. Create a completely original design inspired only by the idea of an interactive digital wedding invitation.

The final website should feel like a combination of:

* Luxury wedding invitation
* Editorial photography
* Cinematic storytelling
* Minimal modern UI
* Indian wedding elegance
* Premium hospitality website

The experience should feel **expensive, calm, emotional and memorable**, rather than like a generic wedding template.

---

# 1. Recommended Tech Stack

Build the application using:

* Next.js 14+
* React
* TypeScript
* Tailwind CSS
* Framer Motion
* Lucide React icons
* Google Fonts / locally optimized fonts
* Supabase or PostgreSQL for persistent wedding data
* Next.js API routes / Server Actions
* Vercel deployment

Use reusable components and keep the architecture production-ready.

---

# 2. Visual Direction

## Overall Style

Create a sophisticated editorial aesthetic.

Avoid:

* Excessive gradients
* Bright wedding colors
* Generic template-looking cards
* Excessive emojis
* Overly decorative Indian wedding graphics
* Too many borders
* Huge amounts of text
* Cluttered layouts
* Copying the reference site's visual style

Instead use:

* Warm ivory / off-white backgrounds
* Deep charcoal typography
* Very subtle muted rose / champagne accents
* Fine lines
* Large whitespace
* Elegant serif typography
* Clean modern sans-serif supporting typography
* Editorial photography
* Soft transitions
* Subtle grain/noise texture
* Delicate botanical details
* Cinematic image crops

Suggested palette:

```text
Ivory       #F8F5EF
Warm White  #FFFCF7
Charcoal    #202020
Muted Rose  #B58F8F
Champagne   #C9B38C
Soft Beige  #E9E1D5
```

Do not use all colors everywhere. The design should remain restrained.

---

# 3. Typography

Use two complementary typefaces.

### Display Font

Elegant serif such as:

* Cormorant Garamond
* Playfair Display
* DM Serif Display

### Body Font

Modern clean sans-serif such as:

* Inter
* Manrope
* DM Sans

Typography should create a strong editorial hierarchy.

Example:

```text
N & A

A NEW CHAPTER
BEGINS

15 DECEMBER 2026
```

Use large typography sparingly.

---

# 4. Landing / Opening Experience

The first screen should feel like opening a luxury invitation.

Create a full-screen hero.

Display:

```text
THE WEDDING OF

[BRIDE NAME]
&
[GROOM NAME]

[DATE]
[LOCATION]
```

Add a subtle animated line or decorative mark.

Include:

**"Open Invitation"**

button.

When clicked:

* Smooth transition into the website
* Gentle fade / scale animation
* Optional soft ambient sound control
* Do not autoplay audio aggressively

The opening should feel cinematic but remain fast and accessible.

---

# 5. Hero Section

After opening the invitation:

Create an immersive hero section using the couple's photograph.

Layout:

```text
Large cinematic image

        [BRIDE NAME]
              &
        [GROOM NAME]

     TWO STORIES
      ONE CHAPTER

       [DATE]
```

Add subtle parallax movement.

The couple's names should be the main visual focus.

Add a small scroll indicator:

```text
SCROLL TO DISCOVER
↓
```

---

# 6. Our Story

Create a minimal storytelling section.

Heading:

```text
OUR STORY
```

Use a horizontal or vertical timeline.

Example:

```text
THE FIRST HELLO
2022

A simple beginning...

↓

THE MOMENT
2023

The story started becoming something more.

↓

THE YES
2025

And then came forever.
```

Keep the actual content editable from the admin dashboard.

Allow:

* Story title
* Story description
* Date
* Image

---

# 7. Countdown

Create a beautiful minimal countdown.

Display:

```text
UNTIL WE SAY
"I DO"

126     08     32     14
DAYS   HOURS  MINUTES SECONDS
```

Use animated number transitions.

Countdown must automatically calculate from the configured wedding date/time.

After the wedding date, replace the countdown with:

```text
THE DAY HAS ARRIVED
```

---

# 8. Wedding Events

Create an elegant event section.

Title:

```text
THE CELEBRATION
```

Each event should have:

* Event name
* Date
* Time
* Venue
* Address
* Description
* Dress code
* Image
* Google Maps URL

Example:

```text
01

MEHENDI

14 DECEMBER
06:00 PM

Venue Name
Ahmedabad, Gujarat

An evening of colour,
music and celebration.

DRESS CODE
Pastel / Floral

[VIEW LOCATION]
```

Possible events:

* Engagement
* Haldi
* Mehendi
* Sangeet
* Wedding
* Reception

The admin should be able to:

* Add event
* Edit event
* Delete event
* Reorder events

---

# 9. Wedding Day Timeline

Create a vertical timeline.

Example:

```text
04:30 PM
Guests Arrive

05:00 PM
Varmala

06:00 PM
Wedding Ceremony

08:00 PM
Dinner

09:30 PM
Celebration
```

Animate each timeline item when it enters the viewport.

All timeline information must be editable.

---

# 10. Venue Section

Create a premium editorial venue section.

Use a large venue image.

Display:

```text
THE VENUE

[VENUE NAME]

[ADDRESS]

[CITY, STATE]

[GET DIRECTIONS]
```

The "Get Directions" button should open Google Maps.

Allow the admin to edit:

* Venue name
* Address
* Map URL
* Venue image

---

# 11. Gallery

Create a cinematic photo gallery.

Do NOT use a standard boring grid.

Use an editorial asymmetric masonry-style layout.

Features:

* Couple photographs
* Pre-wedding photos
* Family photographs
* Wedding moments
* Full-screen lightbox
* Smooth image transitions

Admin should be able to:

* Upload images
* Delete images
* Reorder images
* Add captions

Optimize images automatically.

---

# 12. Family Section

Create a subtle family introduction.

Example:

```text
WITH THE BLESSINGS OF

THE [BRIDE] FAMILY

&

THE [GROOM] FAMILY
```

Allow optional family names and parents' names.

Keep this section elegant and uncluttered.

---

# 13. RSVP

Create a minimal RSVP form.

Fields:

```text
Your Name
Phone Number
Number of Guests
Will you attend?
Dietary Preference
Message
```

Buttons:

```text
JOYFULLY ACCEPT
REGRETFULLY DECLINE
```

Store RSVP submissions in the database.

Admin dashboard should show:

```text
Total Guests
Attending
Not Attending
Pending
```

---

# 14. Guest Wishes

Create a small interactive guestbook.

Guests can submit:

```text
Name
Message
```

Display approved messages in an elegant scrolling section.

Example:

```text
"May your life together always
be filled with laughter."

— Rahul & Priya
```

Admin should be able to:

* Approve message
* Hide message
* Delete message

Do not automatically publish unmoderated messages.

---

# 15. Optional Music

Add a small floating music control.

Example:

```text
♪ MUSIC
```

Requirements:

* Music must not autoplay unexpectedly
* User explicitly starts/stops music
* Persist preference during the session
* Use an elegant minimal control

---

# 16. Final Section

End the website with an emotional closing.

Example:

```text
AND SO,
OUR NEXT CHAPTER BEGINS.

[BRIDE]
&
[GROOM]

[DATE]

Thank you for being part
of our story.
```

Add a subtle animated line / flower / star detail.

---

# 17. Navigation

Do NOT create a large traditional navbar.

Use a minimal floating navigation.

Possible items:

```text
STORY
EVENTS
VENUE
GALLERY
RSVP
```

On mobile, use a compact menu.

Navigation should smoothly scroll to sections.

---

# 18. OWNER LOGIN SYSTEM

Create a separate owner login page:

```text
/login
```

Design it like a premium private dashboard entrance.

Display:

```text
PRIVATE ACCESS

Manage Your Wedding

Username
Password

[ENTER]
```

Do not expose credentials anywhere in the frontend source code.

---

# 19. Fixed Login Credentials

For the first version, support configurable fixed credentials through environment variables.

Example:

```env
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_secure_password
```

Never hardcode the password directly into React components.

The username and password should be changeable through environment configuration.

For production, use proper authentication/session handling rather than client-side checks.

---

# 20. Authentication Requirements

Implement:

* Secure login
* HTTP-only session cookie
* Protected `/admin` routes
* Redirect unauthenticated users to `/login`
* Logout functionality
* Session expiration
* Server-side authentication checks

Do NOT implement authentication using:

```text
localStorage username/password
```

Do NOT put the admin password in:

```text
NEXT_PUBLIC_*
```

because those variables are exposed to the browser.

---

# 21. ADMIN DASHBOARD

Create:

```text
/admin
```

The dashboard should feel like a clean premium CMS.

Sidebar:

```text
Overview
Wedding Details
Couple
Story
Events
Timeline
Venue
Gallery
Family
RSVP
Guest Wishes
Settings
Logout
```

---

# 22. Wedding Details Editor

Admin should be able to edit:

```text
Bride Name
Groom Name
Wedding Date
Wedding Time
Location
Wedding Hashtag
Hero Image
Introduction Text
Closing Message
```

Include:

```text
SAVE CHANGES
```

Show a success message after saving.

---

# 23. Couple Editor

Allow editing:

```text
Bride Name
Groom Name
Bride Photo
Groom Photo
Couple Photo
Short Introduction
```

---

# 24. Event Management

Create CRUD functionality.

Admin can:

```text
+ Add Event
```

Each event:

```text
Event Name
Date
Time
Venue
Address
Description
Dress Code
Image
Google Maps URL
Display Order
```

Actions:

```text
Edit
Delete
Move Up
Move Down
```

---

# 25. Gallery Management

Admin can upload images.

Features:

```text
Upload Image
Preview
Reorder
Delete
Add Caption
```

Use drag-and-drop reordering if practical.

---

# 26. RSVP Dashboard

Show statistics.

Example:

```text
RSVP OVERVIEW

128 Total Responses

92 Attending
21 Not Attending
15 Pending
```

Create a table:

```text
Name | Phone | Guests | Status | Message | Date
```

Add:

```text
Search
Filter
Sort
Export CSV
```

---

# 27. Guest Wishes Dashboard

Show:

```text
Pending
Approved
Hidden
```

Admin actions:

```text
Approve
Hide
Delete
```

---

# 28. Live Preview

Add a button in the admin dashboard:

```text
VIEW INVITATION ↗
```

The admin should be able to preview the public wedding invitation.

If practical, add a split-screen preview:

```text
EDITOR             PREVIEW
--------           --------
Wedding Name       Live website
Date               Live website
Events             Live website
Images             Live website
```

---

# 29. Data Architecture

Create database models/tables similar to:

```text
wedding
couple
story
events
timeline
venues
gallery
family
rsvps
guest_wishes
admin/session
```

Keep the schema modular.

All public wedding content should come from the database rather than being hardcoded into the page.

---

# 30. API / Server Actions

Create clean server-side operations for:

```text
GET wedding details
UPDATE wedding details

GET couple
UPDATE couple

GET events
CREATE event
UPDATE event
DELETE event

GET gallery
UPLOAD gallery image
DELETE gallery image

GET RSVPs
CREATE RSVP
UPDATE RSVP

GET guest wishes
CREATE guest wish
APPROVE guest wish
HIDE guest wish
DELETE guest wish
```

Validate all incoming data server-side.

---

# 31. Responsive Design

Mobile is the PRIMARY experience.

The website must look excellent on:

* Android phones
* iPhones
* Tablets
* Laptops
* Large desktop screens

Pay special attention to:

* 360px width
* 390px width
* 430px width
* 768px tablet
* 1440px desktop

No horizontal overflow.

---

# 32. Animation Direction

Animations should feel premium and subtle.

Use Framer Motion for:

* Fade-in
* Text reveal
* Image reveal
* Scroll animations
* Parallax
* Page transitions
* Timeline animations
* Gallery transitions
* Number animations

Avoid excessive animations.

The website should feel:

**slow, elegant, cinematic and intentional.**

Not:

**flashy, game-like or overloaded.**

Respect `prefers-reduced-motion`.

---

# 33. Performance

Optimize aggressively.

Requirements:

* Next.js Image
* Lazy-load gallery images
* Optimized fonts
* Avoid unnecessary JavaScript
* Use server components where appropriate
* Compress images
* Avoid large video files unless necessary
* Maintain excellent mobile performance

Target:

```text
Lighthouse Performance: 90+
Accessibility: 90+
Best Practices: 90+
SEO: 90+
```

---

# 34. SEO

Add:

* Dynamic title
* Meta description
* Open Graph image
* Twitter/X card
* Favicon
* Wedding-specific metadata

Example:

```text
[BRIDE] & [GROOM] — Our Wedding
```

---

# 35. Accessibility

Include:

* Semantic HTML
* Keyboard navigation
* Proper labels
* Accessible buttons
* Alt text
* Sufficient contrast
* Focus states
* Reduced motion support

Do not rely only on color to communicate information.

---

# 36. Error / Empty States

Create polished empty states.

Examples:

```text
No events added yet.
```

```text
No gallery photos yet.
```

```text
No RSVP responses yet.
```

Do not show broken layouts.

---

# 37. Loading States

Use elegant skeleton loaders.

Avoid generic spinning loaders everywhere.

---

# 38. Important Security Requirements

Never expose:

* Admin password
* Database credentials
* API secrets
* Supabase service role key
* Private storage credentials

Use environment variables.

Validate all admin operations on the server.

Protect admin API routes against unauthorized access.

---

# 39. Folder Structure

Use a clean architecture similar to:

```text
app/
├── page.tsx
├── login/
│   └── page.tsx
├── admin/
│   ├── page.tsx
│   ├── wedding/
│   ├── couple/
│   ├── story/
│   ├── events/
│   ├── gallery/
│   ├── rsvp/
│   ├── wishes/
│   └── settings/
├── api/
│   ├── auth/
│   ├── wedding/
│   ├── events/
│   ├── gallery/
│   ├── rsvp/
│   └── wishes/
├── components/
│   ├── invitation/
│   ├── admin/
│   ├── ui/
│   └── animations/
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   └── validation.ts
└── types/
```

---

# 40. UX Principle

The public invitation should feel like a **digital wedding film**, not a dashboard.

The admin panel should feel like a **simple wedding CMS**.

Keep these experiences visually separate.

Public:

> Emotional • Cinematic • Romantic • Minimal

Admin:

> Clean • Practical • Fast • Organized

---

# 41. Sample Content

Use fictional placeholder data.

Example:

```text
AARAV
&
MEERA

18 DECEMBER 2026

AHMEDABAD, GUJARAT

Two lives.
One beautiful beginning.
```

Do not use the names/content from the reference website.

---

# 42. Final Quality Requirement

The final result should look like a **premium custom-designed wedding invitation made by a professional digital studio**.

It should NOT look like:

* A copied wedding template
* A generic Tailwind landing page
* A basic CRUD application
* A portfolio project
* A dashboard with a wedding page attached

The most important priority is:

## BEAUTIFUL PUBLIC EXPERIENCE + SIMPLE EDITABLE CONTENT SYSTEM

The website must allow the wedding owner to log in, update wedding information, and immediately see those changes reflected on the public invitation.

Build the UI polished enough that it could realistically be used as a premium wedding invitation product.
