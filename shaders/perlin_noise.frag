// Permuted Congruential Generator - not affected by floating point precision
// Returns a pseudo-random 2D vector [-1.0; 1.0]
vec2 hash22(vec2 p)
{
    uvec2 v = uvec2(ivec2(p));

    // Bitwise mixing
    v = v * 1664525u + 1013904223u;
    v.x += v.y * 1664525u;
    v.y += v.x * 1664525u;
    v = v ^ (v >> 16u);
    v.x += v.y * 1664525u;
    v.y += v.x * 1664525u;
    v = v ^ (v >> 16u);

    // Convert back to floats and map from [0, MAX_UINT] to [-1.0, 1.0]
    return vec2(v) * (1.0 / float(0xffffffffu)) * 2.0 - 1.0;
}

// Perlin noise function
float perlinNoise(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u = smoothstep(0.0, 1.0, f);
    //vec2 u = f * f * (3.0 - 2.0 * f); // avoid clamping?

    float a = dot(hash22(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
    float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Normalize pixel coords
    vec2 uv = fragCoord / iResolution.xy;

    // Normalize to aspect ratio to avoid stretching
    uv.x *= iResolution.x / iResolution.y;

    // Normalize mouse coords
    vec2 m = iMouse.xy / iResolution.xy;

    // Play around with pos and zoom
    vec2 pos = uv * m.y * 10.0 + m.x * 20.0;

    // Move diagonally
    pos += iTime * 0.5;

    // Perlin outputs -1.0 to 1.0
    float noiseVal = perlinNoise(pos);
    noiseVal = noiseVal * 0.5 + 0.5;

    fragColor = vec4(vec3(noiseVal), 1.0);
}