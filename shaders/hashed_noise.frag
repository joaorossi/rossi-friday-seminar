// Returns a pseudo-random float between 0.0 and 1.0
float hash21(vec2 p)
{
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Budget-friendly option, no sin function
// Does not work very well with small values of p
float hash12(vec2 p)
{
    vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;

    float noise = hash21(uv);
    //float noise = hash12(fragCoord); // works better with abs coords

    // Output to screen
    fragColor = vec4(vec3(noise),1.0);
}