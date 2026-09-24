// Returns the distance from point p to the surface
// of a sphere of size s centered at the origin (0, 0, 0)
float sdSphere(vec3 p, float s)
{
    return length(p) - s;
}

// Signed Distance Function (SDF)
// Returns the distance from point p to the closest point in the scene
float SDF(vec3 p)
{
    // Only one sphere in our scene, for now...
    return sdSphere(p, 1.0);
}

// Minimum distance to consider a hit
#define MIN_DIST 0.00001

// Maximim total distance, nothing to hit
#define MAX_TOTAL_DIST 10.0

// Maximin marching steps
#define MAX_STEPS 100

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;

    // Camera setup

    // Ray Origin
    // The position of the camera or eye
    vec3 ro = vec3(0.0, 0.0, 1.5);

    // Ray Direction
    // A vector that points from the camera into the current pixel (uv)
    // The -1.0 is the focal length, negative Z points "into" the screen
    vec3 rd = normalize(vec3(uv, -1.0));

    // Total distance traveled
    float t = 0.0;


    // Scene colors
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
            // Paint the pixel with the sphere color
            // Make it darker the further it is from the camera
            col = sphere_color - t * vec3(0.7);
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