float dot2(in vec3 v) { return dot(v,v); }

float hash21(vec2 p)
{
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
}

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

float fbm(vec2 p)
{
    float value = 0.0;
    float frequency = 5.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++)
    {
        value += amplitude * perlinNoise(p * frequency);
        frequency *= 2.5;
        amplitude *= 0.5;
    }
    return 0.5 + 0.5 * value;
}

mat2 rotation(float a)
{
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s,  c);
}

// Get the rotation matrix based on mouse movements
mat2 mouseKnobTwist()
{
    // Get knob rotation in rad
    float rad = 5.5 * (iMouse.y / iResolution.y) - 2.75;
    
    // Apply rotation
    return rotation(rad);
}

// Camera with more intuitive controls
vec3 camera(vec3 position, vec3 target, vec2 uv)
{
    vec3 forward = normalize(target - position);
    vec3 worldUp = vec3(0.0, 1.0, 0.0); // which way is up
    vec3 right = normalize(cross(worldUp, forward));
    vec3 up = cross(forward, right);
    mat3 cameraMatrix = mat3(right, up, forward);
    return cameraMatrix * normalize(vec3(uv, 1.0));
}


float sdRoundCone(vec3 p, vec3 a, vec3 b, float r1, float r2)
{
  vec3  ba = b - a;
  float l2 = dot(ba,ba);
  float rr = r1 - r2;
  float a2 = l2 - rr*rr;
  float il2 = 1.0/l2;
    
  vec3 pa = p - a;
  float y = dot(pa,ba);
  float z = y - l2;
  float x2 = dot2( pa*l2 - ba*y );
  float y2 = y*y*l2;
  float z2 = z*z*l2;

  // single square root!
  float k = sign(rr)*rr*rr*x2;
  if( sign(z)*a2*z2>k ) return  sqrt(x2 + z2)        *il2 - r2;
  if( sign(y)*a2*y2<k ) return  sqrt(x2 + y2)        *il2 - r1;
                        return (sqrt(x2*a2*il2)+y*rr)*il2 - r1;
}

float sdCappedCone(vec3 p, vec3 a, vec3 b, float ra, float rb)
{
  float rba  = rb-ra;
  float baba = dot(b-a,b-a);
  float papa = dot(p-a,p-a);
  float paba = dot(p-a,b-a)/baba;
  float x = sqrt( papa - paba*paba*baba );
  float cax = max(0.0,x-((paba<0.5)?ra:rb));
  float cay = abs(paba-0.5)-0.5;
  float k = rba*rba + baba;
  float f = clamp( (rba*(x-ra)+paba*baba)/k, 0.0, 1.0 );
  float cbx = x-ra - f*rba;
  float cby = paba - f;
  float s = (cbx<0.0 && cay<0.0) ? -1.0 : 1.0;
  return s*sqrt( min(cax*cax + cay*cay*baba,
                     cbx*cbx + cby*cby*baba) );
}

float opSmoothUnion(float a, float b, float k)
{
    k *= 4.0;
    float h = max(k-abs(a-b),0.0);
    return min(a, b) - h*h*0.25/k;
}

// Signed Distance Function (SDF)
float SDF(vec3 p)
{
    p.xz *= mouseKnobTwist();

    float height = 0.075;
    float topRadius = 0.75;
    float botRadius = 1.0;

    float rc = sdRoundCone(p,
        vec3(-topRadius, height, 0.0),
        vec3(topRadius, height, 0.0),
        0.025, 0.075);

    float cc = sdCappedCone(p,
        vec3(0.0), vec3(0.0, height, 0.0), 1.0, topRadius);

    return opSmoothUnion(rc, cc, 0.01);
}

// Calculate scene normals
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

    vec3 ro = vec3(0.6, 1.3, 0.0);
    vec3 target = vec3(0.0);
    vec3 rd = camera(ro, target, uv);
    float t = 0.0;

    // Diffuse light direction
    vec3 lightDir = normalize(vec3(-1.0, 1.0, 1.0));

    // Initialize pixel with background texture
    vec3 col = vec3(hash21(uv)) * 0.05 + vec3(0.1);

    for(int i = 0; i < MAX_STEPS; i++)
    {
        vec3 p = ro + rd * t;
        float d = SDF(p);

        // If distance is small enough, means we hit the surface
        if(d < MIN_DIST)
        {
            vec3 n = calcNormal(p);
            float diffuse = max(dot(n, lightDir), 0.1);
            
            // We also need to rotate the knob texture
            col = vec3(fbm(p.xz * mouseKnobTwist())) * diffuse;
            break;
        }

        // If we march too far, means there is not shape to be drawn
        if(t > MAX_TOTAL_DIST)
        {
            break;
        }

        t += d;
    }

    col = pow(col, vec3(0.4545));
    fragColor = vec4(col, 1.0);
}
