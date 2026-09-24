// Painting

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
    float fbm0 = fbm(st, freq0, 0.5);
    float fbm1 = fbm(st + vec2(2.4, 5.3), freq1, 0.5);
    vec2 q = vec2(fbm0, fbm1);
    return fbm(st + 4.0 * q, 2.0, 0.5);
}

vec3 palette(in float t)
{
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(2.0, 1.0, 0.0);
    vec3 d = vec3(0.50, 0.20, 0.25);
    return a + b * cos(6.283185*(c*t+d));
}

vec3 paint(vec2 pos)
{
    float noiseVal = domainWarp(pos, 1.3452, 0.459348);
    noiseVal = noiseVal * 0.5 + 0.5;
    return palette(noiseVal);
}

// Camera
vec3 camera(vec3 position, vec3 target, vec2 uv)
{
    vec3 forward = normalize(target - position);
    vec3 worldUp = vec3(0.0, 1.0, 0.0); // which way is up
    vec3 right = normalize(cross(worldUp, forward));
    vec3 up = cross(forward, right);
    mat3 cameraMatrix = mat3(right, up, forward);
    return cameraMatrix * normalize(vec3(uv, 1.0));
}

// A torus, or a doughnut...
float sdTorus(vec3 p, vec2 t)
{
    vec2 q = vec2(length(p.xz)-t.x,p.y);
    return length(q)-t.y;
}

float SDF(in vec3 p)
{
    return sdTorus(p, vec2(0.6, 0.15));
}

vec3 calcNormal(vec3 p)
{
    vec2 d = vec2(0.001, 0.0); // differential
    return normalize(vec3(
        SDF(p + d.xyy) - SDF(p - d.xyy),
        SDF(p + d.yxy) - SDF(p - d.yxy),
        SDF(p + d.yyx) - SDF(p - d.yyx)
    ));
}

// Minimum distance to consider a hit
#define MIN_DIST 0.0001

// Maximim total distance, nothing to hit
#define MAX_TOTAL_DIST 10.0

// Maximin marching steps
#define MAX_STEPS 100

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;

    // Circle the camera around
    float time = mod(iTime, 6.2831853);
    vec3 ro = vec3(sin(time), cos(time), 0.5);
    vec3 rd = camera(ro, vec3(0.0), uv);
    float t = 0.0;

    // Diffuse light source
    // Only the direction is needed
    vec3 lightDir = normalize(vec3(1.0));

    // Initialize pixel color with background
    vec3 col = vec3(0);

    for(int i = 0; i < MAX_STEPS; i++)
    {
        // Calculate current position
        vec3 p = ro + rd * t;

        // Calculate the distanct to scene
        float d = SDF(p);

        // If distance is small enough, means we hit the surface
        if(d < MIN_DIST)
        {
            // Paint the torus with domain warpped noise
            vec3 n = calcNormal(p);
            float diffuse = max(dot(n, lightDir), 0.1);
            col = paint(p.xy) * diffuse;
            break;
        }

        // If we march too far, means there is not shape to be drawn
        if(t > MAX_TOTAL_DIST)
        {
            // Paint background with noise pattern
            col = palette(fbm(uv + iTime * 0.1, 1.75, 0.35));
            break;
        }

        // March the ray on the distance returned by the SDF
        t += d;
    }

    // Gamma correction
    col = pow(col, vec3(0.4545));

    // Output final color to the screen
    fragColor = vec4(col, 1.0);
}
