/**
 * Date Formatter Module
 * Handles formatting of dates according to different academic citation styles
 */

/**
 * Date formatting utilities
 */
export class DateFormatter {
  /**
   * Format date for MLA style
   * @param date - Date object or undefined
   * @returns Formatted date string
   */
  static formatMLA(date?: Date): string {
    if (!date) return '';
    
    const year = date.getFullYear();
    return year.toString();
  }

  /**
   * Format date for Chicago style
   * @param date - Date object or undefined
   * @returns Formatted date string
   */
  static formatChicago(date?: Date): string {
    if (!date) return '';
    
    const year = date.getFullYear();
    return year.toString();
  }

  /**
   * Format date for Harvard style
   * @param date - Date object or undefined
   * @returns Formatted date string
   */
  static formatHarvard(date?: Date): string {
    if (!date) return 'n.d.'; // no date
    
    const year = date.getFullYear();
    return year.toString();
  }

  /**
   * Format date for APA style
   * @param date - Date object or undefined
   * @returns Formatted date string
   */
  static formatAPA(date?: Date): string {
    if (!date) return 'n.d.'; // no date
    
    const year = date.getFullYear();
    return year.toString();
  }

  /**
   * Format access date for APA style
   * @param date - Access date
   * @returns Formatted access date string
   */
  static formatAccessDateAPA(date?: Date): string {
    if (!date) return '';
    
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `Retrieved ${month} ${day}, ${year}`;
  }

  /**
   * Format full date for MLA style
   * @param date - Date object
   * @returns Formatted full date string (Day Month Year)
   */
  static formatFullDateMLA(date?: Date): string {
    if (!date) return '';
    
    const months = [
      'Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June',
      'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  }

  /**
   * Format full date for Chicago style
   * @param date - Date object
   * @returns Formatted full date string (Month Day, Year)
   */
  static formatFullDateChicago(date?: Date): string {
    if (!date) return '';
    
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${month} ${day}, ${year}`;
  }

  /**
   * Format full date for APA style
   * @param date - Date object
   * @returns Formatted full date string (Year, Month Day)
   */
  static formatFullDateAPA(date?: Date): string {
    if (!date) return '';
    
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${year}, ${month} ${day}`;
  }
}
