# VFTech logo

![Before / after](before_after.png)

| File | Use |
|---|---|
| `vftech-logo.svg` | Horizontal lockup (monogram + wordmark), transparent |
| `vftech-monogram.svg` | Monogram master, 1000-unit grid, no transforms |
| `vftech-icon.svg` | Square 1254 px icon, white background, optically centred |
| `build.py` | Regenerates all three from the construction below |

## Construction

**Monogram** is built on an equilateral triangle with a side of 1000 units. Every angle is 30°, 60°, 90° or 120°.

- Stem and top bar are 95 units. The V arm is 175 units measured horizontally, which is 151.6 measured perpendicular.
- All internal gaps are 85 units, and the F arms are 105 and 85 units.
- The diagonal of the F lies exactly on the right edge of the triangle.

**T** is a custom glyph.

- Stem and crossbar are both 54.3 units, the same as the Montserrat Bold stem.
- The crossbar is a parallelogram with 60° ends, parallel to the monogram's cut.
- The top of the crossbar aligns with the ascender of the h.

**e c h** are set in Montserrat Bold (700), SIL OFL 1.1, at tracking −24 (−0.024 em), and converted to outlines.

**Lockup**

- The monogram is scaled to 0.3732 relative to the wordmark grid.
- The 60° gap between the mark's top bar and the T crossbar is 42 units wide.
- The bottom point of the mark sits 40 units below the baseline.

**Icon**: the mark is shifted 41 px below the true centre of its bounding box. The triangle is top-heavy (its ink centroid is at 34% of its height), so a box-centred mark looks too high.

## Known limitations

- The 30° points (V tip, F tip, V crotch) and the 85-unit gaps fill in below about 24 px. A simplified favicon cut with wider gaps would fix this.
