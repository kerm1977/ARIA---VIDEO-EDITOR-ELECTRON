/**
 * CRITICAL: PLAYHEAD POSITIONING CONFIGURATION
 * 
 * This configuration defines the FIXED positioning of the playhead.
 * The playhead MUST ALWAYS be positioned at 10px from the left edge of the timeline container.
 * This offset aligns the playhead with the zero mark of the time ruler.
 * 
 * ⚠️ DO NOT MODIFY THESE VALUES ⚠️
 * - The 10px offset is critical for alignment with the ruler
 - Changing this value will break the alignment between playhead and ruler
 * - This configuration is protected and should not be altered by anyone
 * 
 * The playhead position is calculated as: calc(position% + 10px)
 * where position is the percentage (0-100) and 10px is the FIXED offset
 */

export const PLAYHEAD_CONFIG = {
  /**
   * Fixed offset from the left edge of the timeline container
   * This value MUST remain at 10px to align with the ruler zero mark
   */
  LEFT_OFFSET: 10, // pixels - DO NOT CHANGE

  /**
   * Whether the playhead position is protected from modification
   * This should always be true
   */
  PROTECTED: true,

  /**
   * Get the CSS left value for the playhead
   * @param position - The percentage position (0-100)
   * @returns CSS calc expression with fixed 10px offset
   */
  getLeftPosition: (position: number): string => {
    return `calc(${position}% + ${PLAYHEAD_CONFIG.LEFT_OFFSET}px)`
  }
} as const

// Freeze the configuration to prevent modifications
Object.freeze(PLAYHEAD_CONFIG)
