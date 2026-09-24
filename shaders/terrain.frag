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

// lacunarity: Rate at which frequency will be increased (> 1.0)
// persistence: Rate at which amplitude will be decreased (< 1.0)
float fbm(vec2 p, float amplitude, float frequency, float lacunarity, float persistence)
{
    float value = 0.0;
    for (int i = 0; i < NUM_OCTAVES; i++)
    {
        value += amplitude * perlinNoise(p * frequency);
        frequency *= lacunarity;
        amplitude *= persistence;
    }

    return value;
}

// Camera with more intuitive controls
vec3 camera(vec3 position, vec3 target, vec2 uv)
{
    vec3 forward = normalize(target - position);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
    vec3 up = cross(forward, right);
    mat3 cameraMatrix = mat3(right, up, forward);
    return cameraMatrix * normalize(vec3(uv, 1.0));
}

// Signed Distance Function (SDF)
float SDF(vec3 p)
{
    // Use FBM to generate a height map
    float height = 3.0 * fbm(p.xz * 0.5, 0.5, 1.0, 1.75, 0.5);
    
    // The distance to the terrain is simply the different
    // between the point "height" and the terrain height
    float d = p.y - height;
    
    // Using FBMs does not plays well, reducing a bit the maximim
    // distance improves the quality at some performance cost
    return d * 0.6;
}

// Calculate scene normals
vec3 calcNormal(vec3 p)
{
    vec2 d = vec2(0.01, 0.0); // differential
    return normalize(vec3(
        SDF(p + d.xyy) - SDF(p - d.xyy),
        SDF(p + d.yxy) - SDF(p - d.yxy),
        SDF(p + d.yyx) - SDF(p - d.yyx)
    ));
}

// Minimum distance to consider a hit
#define MIN_DIST 0.01

// Maximim total distance, nothing to hit
#define MAX_TOTAL_DIST 50.0

// Maximin marching steps
#define MAX_STEPS 100

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;

    // Slow fly by
    vec3 ro = vec3(0.0, 2.0, 0.5 * iTime);
    vec3 target = ro + vec3(0.0, -1.5, 3.0);
    vec3 rd = camera(ro, target, uv);

    // Total distance traveled
    float t = 0.0;

    // Diffuse light direction
    vec3 lightDir = normalize(vec3(1.0));

    // Initialize pixel color with sky color
    vec3 col = vec3(0.5, 0.7, 0.9);

    for(int i = 0; i < MAX_STEPS; i++)
    {
        // Calculate current position
        vec3 p = ro + rd * t;

        // Calculate the distanct to scene
        float d = SDF(p);

        // If distance is small enough, means we hit the surface
        if(d < MIN_DIST)
        {
            // Mix between green and offwhite to simulate snowy moutain peaks
            vec3 terrainColor = mix(
                vec3(0.2, 0.5, 0.2), vec3(0.9, 0.9, 0.9),
                smoothstep(0.0, 0.45, p.y));

            vec3 n = calcNormal(p);
            float diffuse = max(dot(n, lightDir), 0.1);
            col = terrainColor * diffuse;

            // Add some distance-based fog
            // Blends the terrain into the sky color as it gets further away
            float fog = 1.0 - exp(-0.04 * t);
            col = mix(col, vec3(0.5, 0.7, 0.9), fog);

            break;
        }

        // If we march too far, means there is not shape to be drawn
        if(t > MAX_TOTAL_DIST)
        {
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
