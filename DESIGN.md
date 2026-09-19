---
name: Eternal Incense
description: A quiet photographic Korean hanok for personal remembrance.
colors:
  ink: "#f1ece1"
  muted: "#c6c8bc"
  shadow: "#121a17"
  line: "#d8d9cc38"
  dialog: "#17201c"
  field: "#111914"
  action: "#d7decd"
  action-ink: "#18231a"
  action-hover: "#e6eadf"
typography:
  display:
    fontFamily: "Source Sans 3, Noto Sans KR, sans-serif"
    fontSize: "clamp(27px, 2.05vw, 38px)"
    fontWeight: 300
    lineHeight: 1.2
    letterSpacing: ".012em"
  body:
    fontFamily: "Source Sans 3, Noto Sans KR, sans-serif"
    fontSize: "18px"
    lineHeight: 1.45
  korean:
    fontFamily: "Noto Sans KR, sans-serif"
rounded:
  square: "0"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.action-ink}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "10px 20px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "10px 12px"
---

# Design System: Eternal Incense

## Overview

**Creative North Star: "The room is the interface."**

The approved Front Page and Individual Page references establish a photographic Korean hanok: natural wood, paper windows, garden light and quiet remembrance. The built interface keeps clean scenery separate from live memorial photographs, names, incense and ritual dates. Mode: Experience.

**Key Characteristics:**
- Real photographs in wooden frames, resting on an architectural shelf or table.
- Restrained sans-serif text and a small number of visible actions.
- Three incense sticks with slow, translucent smoke.

## Colors

The environment supplies natural wood and foliage color. Interface surfaces use green-black neutrals, soft bone text and pale sage actions; there is no gold interface palette.

Primary actions use `action` with `action-ink`; hover uses `action-hover`. `ink` is ordinary text, `muted` is secondary information, `shadow` is the page foundation and `line` separates quiet rows. `dialog` and `field` keep secondary tasks legible without competing with the room.

## Typography

**The No Serif Rule.** Use Source Sans 3 for English and Noto Sans KR for Korean, with sans-serif fallbacks everywhere. The user's explicit “No Serif Fonts!” correction supersedes the original reference's serif direction.

The hall title is light and softly spaced. Memorial names use regular weight with balanced wrapping; dates are light, with the next observance given medium weight. Korean text uses its dedicated family through language markup. Body text remains readable and unornamented; small uppercase labels are limited to ritual-day captions.

## Layout

Desktop presents a full photographic room with a minimum height of 680px. Live objects track the 3:2 scene's coordinates. Portraits share a physical shelf baseline and scroll horizontally to accommodate every record; names are their only shelf metadata.

At widths of 901px and above, the individual room's vertical scene offset is capped to reserve a 310px lower band beneath the action anchor. Preserve this reservation: long names, offering controls, ritual dates and neighbor links must remain separate on laptop and wide screens.

At 900px and below, use a closer viewpoint rather than shrinking the desktop scene. The hall is at least 850px tall and the individual room at least 930px. Mobile portraits remain substantial, observances scroll horizontally, and actions sit below the portrait. Tablet adjustments cover 600–900px; compact adjustments cover widths through 360px.

## Elevation & Depth

Photographic perspective and directional light provide the main depth. Wooden frames and the ceramic vessel receive restrained cast shadows; text over scenery receives dark shadows for legibility. Secondary dialogs use a dark backdrop and an ambient shadow. Avoid adding floating dashboard surfaces to the room.

## Shapes

Frames are plain, aged wooden squares with ivory mats. Inputs and secondary task surfaces use square geometry and fine borders. Tiny circles belong only to ember tips and the current-day marker; the interface has no pill-based visual language.

## Components

- **Memorial photographs:** real application assets inside a nine-slice photographic wooden frame. Hover lifts a shelf portrait slightly and brightens it. Original photo files remain unchanged; display cropping is CSS only.
- **Incense:** one photographic ceramic bowl, exactly three live sticks and three delicate SVG smoke groups. Drift lasts 24–32 seconds. Reduced motion removes animation and leaves still smoke.
- **Observances:** selectable date rows with subtle separators. Past dates remain visible; the next date has greater contrast and weight. Selecting a date opens calendar actions. Individual memorials with known passing dates show seven weekly dates; unknown dates are never fabricated.
- **Buttons and navigation:** room actions are transparent text controls with underline on hover. Filled pale actions belong to secondary forms and calendar dialogs. Back and neighboring-memorial links remain quiet and readable.
- **Drawers and forms:** native dialogs contain prayer intentions, memorial management, remembrance and further rites. Drawers open at the right, up to 450px wide. Fields have green-black fills, fine borders and visible focus; normal controls have at least 44px height, with the existing desktop inline memorial actions at 36px.
- **Keyboard and focus:** a visible one-pixel pale outline, skip link, semantic controls and native dialog focus containment are part of the design. Reduced motion also disables transitions and smooth scrolling.

## Do's and Don'ts

### Do:
- **Do** keep photographs, memorial data, dates, sticks and smoke separate from photographic scenery.
- **Do** preserve the room's material warmth, readable close mobile viewpoint and quiet lower date band.
- **Do** use the four environment assets with provenance recorded in [images/environment/PROVENANCE.md](images/environment/PROVENANCE.md).
- **Do** preserve the supplied Dexi photograph unchanged.

### Don't:
- **Don't** use serif fonts, including for memorial names, dates or Korean headings.
- **Don't** introduce gold interface styling, corporate navigation or religious decoration.
- **Don't** bake application content into backgrounds or invent memorial photographs or dates.
- **Don't** let the desktop scene's crop push portraits or actions into the observance and navigation bands.

## Offering feedback and motion

Saved flowers appear as up to three photographic blooms on the offering surface with a visible saved confirmation and the total count. Incense wisps advance upward along normalized SVG paths over 16–19 seconds with gentle lateral drift. Reduced motion shows still smoke.
