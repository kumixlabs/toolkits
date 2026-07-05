/**
 * React Email components
 * Re-exports all React Email components for building email templates
 */

// Import all components as a namespace for convenience
import * as ReactEmailComponents from "react-email";

/**
 * Re-export all React Email components for easy access
 * Available components include Html, Head, Body, Container, Section, Row, Column, Text, Heading, Link, Button, Img, Hr, Font, Preview and more
 * @public
 *
 * @see https://react.email/docs/components/html
 */
export * from "react-email";

/**
 * Export the namespace as well for alternative import style
 * @public
 *
 * @example
 * ```typescript
 * import { ReactEmailComponents } from '@kumix/email/components';
 *
 * const MyEmail = () => (
 *   <ReactEmailComponents.Html>
 *     <ReactEmailComponents.Body>
 *       <ReactEmailComponents.Text>Hello World</ReactEmailComponents.Text>
 *     </ReactEmailComponents.Body>
 *   </ReactEmailComponents.Html>
 * );
 * ```
 */
export { ReactEmailComponents };
