vec3 a = vec3(0.5, 0.5, 0.5);
vec3 b = vec3(0.5, 0.5, 0.5);
vec3 c = vec3(2.0, 1.0, 0.0);
vec3 d = vec3(0.50, 0.20, 0.25);

vec3 palette(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d)
{
    return a + b * cos(6.283185*(c*t+d));
}

vec3 gamma(vec3 rgb, float factor)
{
    return pow(rgc, factor);
}
