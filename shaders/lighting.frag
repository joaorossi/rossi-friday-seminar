// Camera with more intuitive controls
// Calculates the ray direction based on position and target
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

// Signed Distance Function (SDF)
// Returns the distance from point p to the closest point in the scene
float SDF(in vec3 p)
{
    return sdTorus(p, vec2(0.6, 0.1));
}

// Calculate scene normals
// We need to know which way the surface is facing to light it
// This is done by calculating the gradient of the surface at point p
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

    // Total distance traveled
    float t = 0.0;


    // Diffuse light source
    // Only the direction is needed
    vec3 lightDir = normalize(vec3(1.0));

    // Scene color
    vec3 background_color = vec3(0.0); // black
    vec3 sphere_color = vec3(0.8);     // off-white

    // Initialize pixel color with background
    vec3 col = background_color;

    for(int i = 0; i < MAX_STEPS; i++)
    {
        // Calculate current position
        vec3 p = ro + rd * t;

        // Calculate the distanct to scene
        float d = SDF(p);

        // If distance is small enough, means we hit the surface
        if(d < MIN_DIST)
        {
            // Get the surface normal
            vec3 n = calcNormal(p);

            // Diffuse lighting is only the dot product of surface normal and light direction
            // Max it with 0.0 to ensure the dark side doesn't get negative light
            float diffuse = max(dot(n, lightDir), 0.0);

            // Apply lighting to sphere color
            // Add a some color offset to prevent the surface getting completely dark
            col = sphere_color * diffuse + vec3(0.1);

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
