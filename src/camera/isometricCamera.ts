export const ISOMETRIC_CAMERA = {
  projection: 'orthographic',
  elevationDegrees: 35.264,
  orbitHeadingsDegrees: [45, 135, 225, 315],
  allowTilt: false,
  allowRoll: false,
  zoom: {
    minimum: 0.65,
    maximum: 2.25,
  },
} as const
