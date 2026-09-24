vec2 hash22(vec2 p)
{
    uvec2 v = uvec2(ivec2(p));
    v = v * 1664525u + 1013904223u;
    v.x += v.y * 1664525u;
    v.y += v.x * 1664525u;
    v = v ^ (v >> 16u);
    v.x += v.y * 1664525u;
    v.y += v.x * 1664525u;
    v = v ^ (v >> 16u);
    return vec2(v) * (1.0 / float(0xffffffffu)) * 2.0 - 1.0;
}

float perlinNoise(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = dot(hash22(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
    float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

#define NUM_OCTAVES 3
float fbm(vec2 p, float lacunarity, float persistence)
{
    float amplitude = 1.0;
    float frequency = 1.0;
    float value = 0.0;
    for (int i = 0; i < NUM_OCTAVES; i++)
    {
        value += amplitude * perlinNoise(p * frequency);
        frequency *= lacunarity;
        amplitude *= persistence;
    }
    return value;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Normalize coordinates from -1.0 to 1.0
    vec2 st = (2.0 * fragCoord - iResolution.xy) / iResolution.y;

    // Convert to Polar
    float radius = length(st);
    float angle = atan(st.y, st.x);

    // Dividing by radius creates depth
    vec2 polarUV = vec2(angle, 1.0 / radius);

    // Add some infinite movement by incrementing radius
    polarUV.y += iTime * 0.5;

    // Basic texture with noise using the new polar-mapped UV
    float c = fbm(polarUV * 5.0, 2.0, 0.2);

    fragColor = vec4(pow(vec3(c), vec3(0.4545)), 1.0);
}