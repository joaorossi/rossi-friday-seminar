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


// Number of layers
#define NUM_OCTAVES 8

// lacunarity: Rate at which frequency will be increased (> 1.0)
// persistence: Rate at which amplitude will be decreased (< 1.0)
float fbm(vec2 p, float amplitude, float frequency, float lacunarity, float persistence)
{
    float value = 0.0;
    for (int i = 0; i < NUM_OCTAVES; i++)
    {
        // Sample the noise at the current frequency and amplitude
        value += amplitude * perlinNoise(p * frequency);

        // Prepare variables for the next octave layer
        frequency *= lacunarity;
        amplitude *= persistence;
    }

    return value;
}

vec2 circleAround(float t)
{
    t = mod(t * 0.5, 2.0 * 3.1415926535);
    return vec2(cos(t), sin(t));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    uv.x *= iResolution.x / iResolution.y;

    // Normalize mouse coords
    vec2 m = iMouse.xy / iResolution.xy;

    // Y mouse will control lacunarity [1.0; 2.0]
    float lacunarity = m.y + 1.0;

    // X mouse will control persistence [0.75; 0.25]
    float persistence = 0.75 - m.x * 0.5;

    // Keep spinning
    vec2 pos = uv + circleAround(iTime) * 2.0;

    float initFreq = 1.0;
    float initAmp = 1.0;
    float noiseVal = fbm(pos, initFreq, initAmp, lacunarity, persistence);
    noiseVal = noiseVal * 0.5 + 0.5;

    fragColor = vec4(vec3(noiseVal), 1.0);
}