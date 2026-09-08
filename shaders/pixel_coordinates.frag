// fragCoord - current pixel being shaded
// fragColor - output colour
void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Normalized pixel coordinates (from 0 to 1) from bottom-left corner
    vec2 uv = fragCoord/iResolution.xy;

    // Normalized pixel coordinates (from -0.5 to 1) from centre
    uv = 2.0 * uv - 1.0;

    // Output to screen
    fragColor = vec4(step(0.0, uv), 0.0, 1.0);
}