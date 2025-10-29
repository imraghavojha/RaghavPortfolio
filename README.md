# raghav ojha - portfolio

personal portfolio website showcasing projects and skills

## structure

```
portfolio/
├── index.html          # main landing page
├── projects.html       # detailed projects showcase
├── style.css          # all styling and animations
├── script.js          # functionality (clock, theme, github api)
└── readme.md          # this file
```

## features

- responsive design with light/dark mode
- animated austin map with zoom effect
- real-time clock (cdt timezone)
- flying plane and cloud animations
- github contribution heatmap (live api)
- projects showcase with browser mockups
- downloadable resume link

## usage

1. open `index.html` in browser
2. click theme toggle (sun/moon) for dark mode
3. navigate to projects page via navbar
4. resume downloads from project files

## customization

update personal info in:
- `index.html` - name, bio, social links
- `projects.html` - project descriptions
- `script.js` - github username for heatmap



## notes

- heatmap loads from github api for username `imraghavojha`
- fallback static heatmap if api fails
- theme preference saved in localstorage
- map shows austin, tx area
- all animations pure css


