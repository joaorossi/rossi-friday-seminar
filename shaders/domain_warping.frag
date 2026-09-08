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

#define NUM_OCTAVES 5
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

float domainWarp(vec2 st, float freq0, float freq1)
{
    // You can play around with some variables to get a nicer effect
    float fbm0 = fbm(st, freq0, 0.5);
    float fbm1 = fbm(st + vec2(2.4, 5.3), freq1, 0.5);

    // Generate an offset vector using noise
    vec2 q = vec2(fbm0, fbm1);

    // Feed the offset back into the noise
    return fbm(st + 4.0 * q, 2.0, 0.5);
}

#define TWO_PI (2.0 * 3.1415926535)

vec2 circleAround(float t)
{
    t = mod(t * 0.05, TWO_PI);
    return 5.0 * vec2(cos(t), sin(t));
}

// Just 3 sines overlapped to create a wobble motion
float sineWobble(float t, float f0, float f1, float f2)
{
    float t0 = mod(t * f0, TWO_PI);
    float t1 = mod(t * f1 + TWO_PI / 3.0, TWO_PI);
    float t2 = mod(t * f2 + 2.0 * TWO_PI / 3.0, TWO_PI);
    float val = sin(t0) + sin(t1) + sin(t2);
    return (val / 6.0) + 0.5;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    uv.x *= iResolution.x / iResolution.y;
    vec2 pos = uv + circleAround(iTime);

    float freq0 = 1.75 + 0.25 * sineWobble(iTime, 0.121, 0.909, 0.523);
    float freq1 = 1.75 + 0.25 * sineWobble(iTime, 0.371, 0.085, 1.063);
    float noiseVal = domainWarp(pos, freq0, freq1);
    noiseVal = noiseVal * 0.5 + 0.5;

    fragColor = vec4(vec3(noiseVal), 1.0);
}