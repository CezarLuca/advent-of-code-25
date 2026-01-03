"use client";

import { useEffect, useRef } from "react";

interface FluidConfig {
    SIM_RESOLUTION: number;
    DYE_RESOLUTION: number;
    DENSITY_DISSIPATION: number;
    VELOCITY_DISSIPATION: number;
    PRESSURE: number;
    PRESSURE_ITERATIONS: number;
    CURL: number;
    SPLAT_RADIUS: number;
    SPLAT_FORCE: number;
    SHADING: boolean;
    COLOR_UPDATE_SPEED: number;
    CHRISTMAS_COLORS: boolean;
}

const defaultConfig: FluidConfig = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1024,
    DENSITY_DISSIPATION: 3.5,
    VELOCITY_DISSIPATION: 2,
    PRESSURE: 0.1,
    PRESSURE_ITERATIONS: 20,
    CURL: 10,
    SPLAT_RADIUS: 0.5,
    SPLAT_FORCE: 6000,
    SHADING: true,
    COLOR_UPDATE_SPEED: 10,
    CHRISTMAS_COLORS: true,
};

interface Pointer {
    id: number;
    texcoordX: number;
    texcoordY: number;
    prevTexcoordX: number;
    prevTexcoordY: number;
    deltaX: number;
    deltaY: number;
    down: boolean;
    moved: boolean;
    color: { r: number; g: number; b: number };
}

function createPointer(): Pointer {
    return {
        id: -1,
        texcoordX: 0,
        texcoordY: 0,
        prevTexcoordX: 0,
        prevTexcoordY: 0,
        deltaX: 0,
        deltaY: 0,
        down: false,
        moved: false,
        color: { r: 0.3, g: 0, b: 0 },
    };
}

export default function FluidCursorEffect({
    config = defaultConfig,
}: {
    config?: Partial<FluidConfig>;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const mergedConfig = { ...defaultConfig, ...config };
        const pointers: Pointer[] = [createPointer()];

        // Get WebGL context
        const params = {
            alpha: true,
            depth: false,
            stencil: false,
            antialias: false,
            preserveDrawingBuffer: false,
        };
        let gl = canvas.getContext(
            "webgl2",
            params
        ) as WebGL2RenderingContext | null;
        const isWebGL2 = !!gl;
        if (!isWebGL2) {
            gl = (canvas.getContext("webgl", params) ||
                canvas.getContext(
                    "experimental-webgl",
                    params
                )) as WebGL2RenderingContext;
        }
        if (!gl) return;

        // Extensions
        let halfFloatTexType: number;
        let supportLinearFiltering: OES_texture_half_float_linear | null;

        if (isWebGL2) {
            gl.getExtension("EXT_color_buffer_float");
            supportLinearFiltering = gl.getExtension(
                "OES_texture_float_linear"
            );
            halfFloatTexType = gl.HALF_FLOAT;
        } else {
            const halfFloat = gl.getExtension("OES_texture_half_float");
            supportLinearFiltering = gl.getExtension(
                "OES_texture_half_float_linear"
            );
            halfFloatTexType = halfFloat?.HALF_FLOAT_OES || gl.HALF_FLOAT;
        }

        gl.clearColor(0.0, 0.0, 0.0, 0.0);

        // Get supported format
        function getSupportedFormat(
            glCtx: WebGL2RenderingContext,
            internalFormat: number,
            format: number,
            type: number
        ): { internalFormat: number; format: number } | null {
            if (
                !supportRenderTextureFormat(glCtx, internalFormat, format, type)
            ) {
                switch (internalFormat) {
                    case glCtx.R16F:
                        return getSupportedFormat(
                            glCtx,
                            glCtx.RG16F,
                            glCtx.RG,
                            type
                        );
                    case glCtx.RG16F:
                        return getSupportedFormat(
                            glCtx,
                            glCtx.RGBA16F,
                            glCtx.RGBA,
                            type
                        );
                    default:
                        return null;
                }
            }
            return { internalFormat, format };
        }

        function supportRenderTextureFormat(
            glCtx: WebGL2RenderingContext,
            internalFormat: number,
            format: number,
            type: number
        ): boolean {
            const texture = glCtx.createTexture();
            glCtx.bindTexture(glCtx.TEXTURE_2D, texture);
            glCtx.texParameteri(
                glCtx.TEXTURE_2D,
                glCtx.TEXTURE_MIN_FILTER,
                glCtx.NEAREST
            );
            glCtx.texParameteri(
                glCtx.TEXTURE_2D,
                glCtx.TEXTURE_MAG_FILTER,
                glCtx.NEAREST
            );
            glCtx.texParameteri(
                glCtx.TEXTURE_2D,
                glCtx.TEXTURE_WRAP_S,
                glCtx.CLAMP_TO_EDGE
            );
            glCtx.texParameteri(
                glCtx.TEXTURE_2D,
                glCtx.TEXTURE_WRAP_T,
                glCtx.CLAMP_TO_EDGE
            );
            glCtx.texImage2D(
                glCtx.TEXTURE_2D,
                0,
                internalFormat,
                4,
                4,
                0,
                format,
                type,
                null
            );

            const fbo = glCtx.createFramebuffer();
            glCtx.bindFramebuffer(glCtx.FRAMEBUFFER, fbo);
            glCtx.framebufferTexture2D(
                glCtx.FRAMEBUFFER,
                glCtx.COLOR_ATTACHMENT0,
                glCtx.TEXTURE_2D,
                texture,
                0
            );

            const status = glCtx.checkFramebufferStatus(glCtx.FRAMEBUFFER);
            return status === glCtx.FRAMEBUFFER_COMPLETE;
        }

        const formatRGBA = isWebGL2
            ? getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType)
            : { internalFormat: gl.RGBA, format: gl.RGBA };
        const formatRG = isWebGL2
            ? getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType)
            : { internalFormat: gl.RGBA, format: gl.RGBA };
        const formatR = isWebGL2
            ? getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType)
            : { internalFormat: gl.RGBA, format: gl.RGBA };

        if (!formatRGBA || !formatRG || !formatR) return;

        // Compile shaders
        function compileShader(
            type: number,
            source: string,
            keywords?: string[]
        ): WebGLShader | null {
            if (keywords) {
                const keywordsString = keywords
                    .map((k) => `#define ${k}\n`)
                    .join("");
                source = keywordsString + source;
            }
            const shader = gl!.createShader(type);
            if (!shader) return null;
            gl!.shaderSource(shader, source);
            gl!.compileShader(shader);
            if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
                console.error(gl!.getShaderInfoLog(shader));
            }
            return shader;
        }

        function createProgram(
            vertexShader: WebGLShader,
            fragmentShader: WebGLShader
        ): WebGLProgram | null {
            const program = gl!.createProgram();
            if (!program) return null;
            gl!.attachShader(program, vertexShader);
            gl!.attachShader(program, fragmentShader);
            gl!.linkProgram(program);
            if (!gl!.getProgramParameter(program, gl!.LINK_STATUS)) {
                console.error(gl!.getProgramInfoLog(program));
            }
            return program;
        }

        function getUniforms(
            program: WebGLProgram
        ): Record<string, WebGLUniformLocation | null> {
            const uniforms: Record<string, WebGLUniformLocation | null> = {};
            const uniformCount = gl!.getProgramParameter(
                program,
                gl!.ACTIVE_UNIFORMS
            );
            for (let i = 0; i < uniformCount; i++) {
                const uniformName = gl!.getActiveUniform(program, i)?.name;
                if (uniformName) {
                    uniforms[uniformName] = gl!.getUniformLocation(
                        program,
                        uniformName
                    );
                }
            }
            return uniforms;
        }

        // Shaders
        const baseVertexShader = compileShader(
            gl.VERTEX_SHADER,
            `precision highp float;
            attribute vec2 aPosition;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform vec2 texelSize;
            void main () {
                vUv = aPosition * 0.5 + 0.5;
                vL = vUv - vec2(texelSize.x, 0.0);
                vR = vUv + vec2(texelSize.x, 0.0);
                vT = vUv + vec2(0.0, texelSize.y);
                vB = vUv - vec2(0.0, texelSize.y);
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }`
        );

        const clearShader = compileShader(
            gl.FRAGMENT_SHADER,
            `precision mediump float;
            precision mediump sampler2D;
            varying highp vec2 vUv;
            uniform sampler2D uTexture;
            uniform float value;
            void main () {
                gl_FragColor = value * texture2D(uTexture, vUv);
            }`
        );

        const copyShader = compileShader(
            gl.FRAGMENT_SHADER,
            `precision mediump float;
            precision mediump sampler2D;
            varying highp vec2 vUv;
            uniform sampler2D uTexture;
            void main () {
                gl_FragColor = texture2D(uTexture, vUv);
            }`
        );

        const splatShader = compileShader(
            gl.FRAGMENT_SHADER,
            `precision highp float;
            precision highp sampler2D;
            varying vec2 vUv;
            uniform sampler2D uTarget;
            uniform float aspectRatio;
            uniform vec3 color;
            uniform vec2 point;
            uniform float radius;
            void main () {
                vec2 p = vUv - point.xy;
                p.x *= aspectRatio;
                vec3 splat = exp(-dot(p, p) / radius) * color;
                vec3 base = texture2D(uTarget, vUv).xyz;
                gl_FragColor = vec4(base + splat, 1.0);
            }`
        );

        const advectionShader = compileShader(
            gl.FRAGMENT_SHADER,
            `precision highp float;
            precision highp sampler2D;
            varying vec2 vUv;
            uniform sampler2D uVelocity;
            uniform sampler2D uSource;
            uniform vec2 texelSize;
            uniform vec2 dyeTexelSize;
            uniform float dt;
            uniform float dissipation;
            vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
                vec2 st = uv / tsize - 0.5;
                vec2 iuv = floor(st);
                vec2 fuv = fract(st);
                vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
                vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
                vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
                vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
                return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
            }
            void main () {
                #ifdef MANUAL_FILTERING
                vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
                vec4 result = bilerp(uSource, coord, dyeTexelSize);
                #else
                vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
                vec4 result = texture2D(uSource, coord);
                #endif
                float decay = 1.0 + dissipation * dt;
                gl_FragColor = result / decay;
            }`,
            supportLinearFiltering ? undefined : ["MANUAL_FILTERING"]
        );

        const divergenceShader = compileShader(
            gl.FRAGMENT_SHADER,
            `precision mediump float;
            precision mediump sampler2D;
            varying highp vec2 vUv;
            varying highp vec2 vL;
            varying highp vec2 vR;
            varying highp vec2 vT;
            varying highp vec2 vB;
            uniform sampler2D uVelocity;
            void main () {
                float L = texture2D(uVelocity, vL).x;
                float R = texture2D(uVelocity, vR).x;
                float T = texture2D(uVelocity, vT).y;
                float B = texture2D(uVelocity, vB).y;
                vec2 C = texture2D(uVelocity, vUv).xy;
                if (vL.x < 0.0) { L = -C.x; }
                if (vR.x > 1.0) { R = -C.x; }
                if (vT.y > 1.0) { T = -C.y; }
                if (vB.y < 0.0) { B = -C.y; }
                float div = 0.5 * (R - L + T - B);
                gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
            }`
        );

        const curlShader = compileShader(
            gl.FRAGMENT_SHADER,
            `precision mediump float;
            precision mediump sampler2D;
            varying highp vec2 vUv;
            varying highp vec2 vL;
            varying highp vec2 vR;
            varying highp vec2 vT;
            varying highp vec2 vB;
            uniform sampler2D uVelocity;
            void main () {
                float L = texture2D(uVelocity, vL).y;
                float R = texture2D(uVelocity, vR).y;
                float T = texture2D(uVelocity, vT).x;
                float B = texture2D(uVelocity, vB).x;
                float vorticity = R - L - T + B;
                gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
            }`
        );

        const vorticityShader = compileShader(
            gl.FRAGMENT_SHADER,
            `precision highp float;
            precision highp sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uVelocity;
            uniform sampler2D uCurl;
            uniform float curl;
            uniform float dt;
            void main () {
                float L = texture2D(uCurl, vL).x;
                float R = texture2D(uCurl, vR).x;
                float T = texture2D(uCurl, vT).x;
                float B = texture2D(uCurl, vB).x;
                float C = texture2D(uCurl, vUv).x;
                vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
                force /= length(force) + 0.0001;
                force *= curl * C;
                force.y *= -1.0;
                vec2 velocity = texture2D(uVelocity, vUv).xy;
                velocity += force * dt;
                velocity = min(max(velocity, -1000.0), 1000.0);
                gl_FragColor = vec4(velocity, 0.0, 1.0);
            }`
        );

        const pressureShader = compileShader(
            gl.FRAGMENT_SHADER,
            `precision mediump float;
            precision mediump sampler2D;
            varying highp vec2 vUv;
            varying highp vec2 vL;
            varying highp vec2 vR;
            varying highp vec2 vT;
            varying highp vec2 vB;
            uniform sampler2D uPressure;
            uniform sampler2D uDivergence;
            void main () {
                float L = texture2D(uPressure, vL).x;
                float R = texture2D(uPressure, vR).x;
                float T = texture2D(uPressure, vT).x;
                float B = texture2D(uPressure, vB).x;
                float C = texture2D(uPressure, vUv).x;
                float divergence = texture2D(uDivergence, vUv).x;
                float pressure = (L + R + B + T - divergence) * 0.25;
                gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
            }`
        );

        const gradientSubtractShader = compileShader(
            gl.FRAGMENT_SHADER,
            `precision mediump float;
            precision mediump sampler2D;
            varying highp vec2 vUv;
            varying highp vec2 vL;
            varying highp vec2 vR;
            varying highp vec2 vT;
            varying highp vec2 vB;
            uniform sampler2D uPressure;
            uniform sampler2D uVelocity;
            void main () {
                float L = texture2D(uPressure, vL).x;
                float R = texture2D(uPressure, vR).x;
                float T = texture2D(uPressure, vT).x;
                float B = texture2D(uPressure, vB).x;
                vec2 velocity = texture2D(uVelocity, vUv).xy;
                velocity.xy -= vec2(R - L, T - B);
                gl_FragColor = vec4(velocity, 0.0, 1.0);
            }`
        );

        const displayShader = compileShader(
            gl.FRAGMENT_SHADER,
            `precision highp float;
            precision highp sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uTexture;
            uniform vec2 texelSize;
            void main () {
                vec3 c = texture2D(uTexture, vUv).rgb;
                #ifdef SHADING
                vec3 lc = texture2D(uTexture, vL).rgb;
                vec3 rc = texture2D(uTexture, vR).rgb;
                vec3 tc = texture2D(uTexture, vT).rgb;
                vec3 bc = texture2D(uTexture, vB).rgb;
                float dx = length(rc) - length(lc);
                float dy = length(tc) - length(bc);
                vec3 n = normalize(vec3(dx, dy, length(texelSize)));
                vec3 l = vec3(0.0, 0.0, 1.0);
                float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
                c *= diffuse;
                #endif
                float a = max(c.r, max(c.g, c.b));
                gl_FragColor = vec4(c, a);
            }`,
            mergedConfig.SHADING ? ["SHADING"] : undefined
        );

        if (
            !baseVertexShader ||
            !clearShader ||
            !copyShader ||
            !splatShader ||
            !advectionShader ||
            !divergenceShader ||
            !curlShader ||
            !vorticityShader ||
            !pressureShader ||
            !gradientSubtractShader ||
            !displayShader
        ) {
            return;
        }

        // Create programs
        const clearProgram = createProgram(baseVertexShader, clearShader);
        const copyProgram = createProgram(baseVertexShader, copyShader);
        const splatProgram = createProgram(baseVertexShader, splatShader);
        const advectionProgram = createProgram(
            baseVertexShader,
            advectionShader
        );
        const divergenceProgram = createProgram(
            baseVertexShader,
            divergenceShader
        );
        const curlProgram = createProgram(baseVertexShader, curlShader);
        const vorticityProgram = createProgram(
            baseVertexShader,
            vorticityShader
        );
        const pressureProgram = createProgram(baseVertexShader, pressureShader);
        const gradientSubtractProgram = createProgram(
            baseVertexShader,
            gradientSubtractShader
        );
        const displayProgram = createProgram(baseVertexShader, displayShader);

        if (
            !clearProgram ||
            !copyProgram ||
            !splatProgram ||
            !advectionProgram ||
            !divergenceProgram ||
            !curlProgram ||
            !vorticityProgram ||
            !pressureProgram ||
            !gradientSubtractProgram ||
            !displayProgram
        ) {
            return;
        }

        const clearUniforms = getUniforms(clearProgram);
        const copyUniforms = getUniforms(copyProgram);
        const splatUniforms = getUniforms(splatProgram);
        const advectionUniforms = getUniforms(advectionProgram);
        const divergenceUniforms = getUniforms(divergenceProgram);
        const curlUniforms = getUniforms(curlProgram);
        const vorticityUniforms = getUniforms(vorticityProgram);
        const pressureUniforms = getUniforms(pressureProgram);
        const gradientSubtractUniforms = getUniforms(gradientSubtractProgram);
        const displayUniforms = getUniforms(displayProgram);

        // Setup geometry
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
            gl.STATIC_DRAW
        );
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array([0, 1, 2, 0, 2, 3]),
            gl.STATIC_DRAW
        );
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        interface FBO {
            texture: WebGLTexture;
            fbo: WebGLFramebuffer;
            width: number;
            height: number;
            texelSizeX: number;
            texelSizeY: number;
            attach: (id: number) => number;
        }

        interface DoubleFBO {
            width: number;
            height: number;
            texelSizeX: number;
            texelSizeY: number;
            read: FBO;
            write: FBO;
            swap: () => void;
        }

        function createFBO(
            w: number,
            h: number,
            internalFormat: number,
            format: number,
            type: number,
            param: number
        ): FBO {
            gl!.activeTexture(gl!.TEXTURE0);
            const texture = gl!.createTexture()!;
            gl!.bindTexture(gl!.TEXTURE_2D, texture);
            gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, param);
            gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, param);
            gl!.texParameteri(
                gl!.TEXTURE_2D,
                gl!.TEXTURE_WRAP_S,
                gl!.CLAMP_TO_EDGE
            );
            gl!.texParameteri(
                gl!.TEXTURE_2D,
                gl!.TEXTURE_WRAP_T,
                gl!.CLAMP_TO_EDGE
            );
            gl!.texImage2D(
                gl!.TEXTURE_2D,
                0,
                internalFormat,
                w,
                h,
                0,
                format,
                type,
                null
            );

            const fbo = gl!.createFramebuffer()!;
            gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
            gl!.framebufferTexture2D(
                gl!.FRAMEBUFFER,
                gl!.COLOR_ATTACHMENT0,
                gl!.TEXTURE_2D,
                texture,
                0
            );
            gl!.viewport(0, 0, w, h);
            gl!.clear(gl!.COLOR_BUFFER_BIT);

            return {
                texture,
                fbo,
                width: w,
                height: h,
                texelSizeX: 1.0 / w,
                texelSizeY: 1.0 / h,
                attach(id: number) {
                    gl!.activeTexture(gl!.TEXTURE0 + id);
                    gl!.bindTexture(gl!.TEXTURE_2D, texture);
                    return id;
                },
            };
        }

        function createDoubleFBO(
            w: number,
            h: number,
            internalFormat: number,
            format: number,
            type: number,
            param: number
        ): DoubleFBO {
            let fbo1 = createFBO(w, h, internalFormat, format, type, param);
            let fbo2 = createFBO(w, h, internalFormat, format, type, param);
            return {
                width: w,
                height: h,
                texelSizeX: fbo1.texelSizeX,
                texelSizeY: fbo1.texelSizeY,
                get read() {
                    return fbo1;
                },
                set read(value) {
                    fbo1 = value;
                },
                get write() {
                    return fbo2;
                },
                set write(value) {
                    fbo2 = value;
                },
                swap() {
                    const temp = fbo1;
                    fbo1 = fbo2;
                    fbo2 = temp;
                },
            };
        }

        function resizeFBO(
            target: FBO,
            w: number,
            h: number,
            internalFormat: number,
            format: number,
            type: number,
            param: number
        ): FBO {
            const newFBO = createFBO(w, h, internalFormat, format, type, param);
            gl!.useProgram(copyProgram);
            gl!.uniform1i(copyUniforms.uTexture, target.attach(0));
            blit(newFBO);
            return newFBO;
        }

        function resizeDoubleFBO(
            target: DoubleFBO,
            w: number,
            h: number,
            internalFormat: number,
            format: number,
            type: number,
            param: number
        ): DoubleFBO {
            if (target.width === w && target.height === h) return target;
            target.read = resizeFBO(
                target.read,
                w,
                h,
                internalFormat,
                format,
                type,
                param
            );
            target.write = createFBO(w, h, internalFormat, format, type, param);
            target.width = w;
            target.height = h;
            target.texelSizeX = 1.0 / w;
            target.texelSizeY = 1.0 / h;
            return target;
        }

        function blit(target: FBO | null, clear = false) {
            if (target === null) {
                gl!.viewport(
                    0,
                    0,
                    gl!.drawingBufferWidth,
                    gl!.drawingBufferHeight
                );
                gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
            } else {
                gl!.viewport(0, 0, target.width, target.height);
                gl!.bindFramebuffer(gl!.FRAMEBUFFER, target.fbo);
            }
            if (clear) {
                gl!.clearColor(0.0, 0.0, 0.0, 1.0);
                gl!.clear(gl!.COLOR_BUFFER_BIT);
            }
            gl!.drawElements(gl!.TRIANGLES, 6, gl!.UNSIGNED_SHORT, 0);
        }

        function getResolution(resolution: number) {
            let aspectRatio = gl!.drawingBufferWidth / gl!.drawingBufferHeight;
            if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;
            const min = Math.round(resolution);
            const max = Math.round(resolution * aspectRatio);
            if (gl!.drawingBufferWidth > gl!.drawingBufferHeight) {
                return { width: max, height: min };
            }
            return { width: min, height: max };
        }

        // Initialize framebuffers
        let dye: DoubleFBO;
        let velocity: DoubleFBO;
        let divergence: FBO;
        let curl: FBO;
        let pressure: DoubleFBO;

        function initFramebuffers() {
            const simRes = getResolution(mergedConfig.SIM_RESOLUTION);
            const dyeRes = getResolution(mergedConfig.DYE_RESOLUTION);
            const filtering = supportLinearFiltering ? gl!.LINEAR : gl!.NEAREST;

            gl!.disable(gl!.BLEND);

            if (!dye) {
                dye = createDoubleFBO(
                    dyeRes.width,
                    dyeRes.height,
                    formatRGBA!.internalFormat,
                    formatRGBA!.format,
                    halfFloatTexType,
                    filtering
                );
            } else {
                dye = resizeDoubleFBO(
                    dye,
                    dyeRes.width,
                    dyeRes.height,
                    formatRGBA!.internalFormat,
                    formatRGBA!.format,
                    halfFloatTexType,
                    filtering
                );
            }

            if (!velocity) {
                velocity = createDoubleFBO(
                    simRes.width,
                    simRes.height,
                    formatRG!.internalFormat,
                    formatRG!.format,
                    halfFloatTexType,
                    filtering
                );
            } else {
                velocity = resizeDoubleFBO(
                    velocity,
                    simRes.width,
                    simRes.height,
                    formatRG!.internalFormat,
                    formatRG!.format,
                    halfFloatTexType,
                    filtering
                );
            }

            divergence = createFBO(
                simRes.width,
                simRes.height,
                formatR!.internalFormat,
                formatR!.format,
                halfFloatTexType,
                gl!.NEAREST
            );
            curl = createFBO(
                simRes.width,
                simRes.height,
                formatR!.internalFormat,
                formatR!.format,
                halfFloatTexType,
                gl!.NEAREST
            );
            pressure = createDoubleFBO(
                simRes.width,
                simRes.height,
                formatR!.internalFormat,
                formatR!.format,
                halfFloatTexType,
                gl!.NEAREST
            );
        }

        // Christmas colors
        const christmasColors = [
            { r: 0.8, g: 0.1, b: 0.1 }, // Red
            { r: 0.1, g: 0.5, b: 0.1 }, // Green
            { r: 0.9, g: 0.8, b: 0.2 }, // Gold
            { r: 0.9, g: 0.9, b: 0.95 }, // White/Snow
            { r: 0.6, g: 0.1, b: 0.1 }, // Dark Red
            { r: 0.1, g: 0.4, b: 0.2 }, // Dark Green
        ];

        function generateColor() {
            if (mergedConfig.CHRISTMAS_COLORS) {
                const color =
                    christmasColors[
                        Math.floor(Math.random() * christmasColors.length)
                    ];
                return {
                    r: color.r * 0.15,
                    g: color.g * 0.15,
                    b: color.b * 0.15,
                };
            }
            // Random rainbow colors
            const c = HSVtoRGB(Math.random(), 1.0, 1.0);
            return { r: c.r * 0.15, g: c.g * 0.15, b: c.b * 0.15 };
        }

        function HSVtoRGB(h: number, s: number, v: number) {
            let r = 0,
                g = 0,
                b = 0;
            const i = Math.floor(h * 6);
            const f = h * 6 - i;
            const p = v * (1 - s);
            const q = v * (1 - f * s);
            const t = v * (1 - (1 - f) * s);
            switch (i % 6) {
                case 0:
                    r = v;
                    g = t;
                    b = p;
                    break;
                case 1:
                    r = q;
                    g = v;
                    b = p;
                    break;
                case 2:
                    r = p;
                    g = v;
                    b = t;
                    break;
                case 3:
                    r = p;
                    g = q;
                    b = v;
                    break;
                case 4:
                    r = t;
                    g = p;
                    b = v;
                    break;
                case 5:
                    r = v;
                    g = p;
                    b = q;
                    break;
            }
            return { r, g, b };
        }

        function scaleByPixelRatio(input: number) {
            const pixelRatio = window.devicePixelRatio || 1;
            return Math.floor(input * pixelRatio);
        }

        // Store canvas dimensions for use in handlers
        const canvasWidth = () => canvas.width;
        const canvasHeight = () => canvas.height;

        function resizeCanvas() {
            if (!canvas) return false;
            const width = scaleByPixelRatio(canvas.clientWidth);
            const height = scaleByPixelRatio(canvas.clientHeight);
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
                return true;
            }
            return false;
        }

        function correctRadius(radius: number) {
            const aspectRatio = canvasWidth() / canvasHeight();
            if (aspectRatio > 1) radius *= aspectRatio;
            return radius;
        }

        function correctDeltaX(delta: number) {
            const aspectRatio = canvasWidth() / canvasHeight();
            if (aspectRatio < 1) delta *= aspectRatio;
            return delta;
        }

        function correctDeltaY(delta: number) {
            const aspectRatio = canvasWidth() / canvasHeight();
            if (aspectRatio > 1) delta /= aspectRatio;
            return delta;
        }

        function splat(
            x: number,
            y: number,
            dx: number,
            dy: number,
            color: { r: number; g: number; b: number }
        ) {
            gl!.useProgram(splatProgram);
            gl!.uniform1i(splatUniforms.uTarget, velocity.read.attach(0));
            gl!.uniform1f(
                splatUniforms.aspectRatio,
                canvasWidth() / canvasHeight()
            );
            gl!.uniform2f(splatUniforms.point, x, y);
            gl!.uniform3f(splatUniforms.color, dx, dy, 0.0);
            gl!.uniform1f(
                splatUniforms.radius,
                correctRadius(mergedConfig.SPLAT_RADIUS / 100.0)
            );
            blit(velocity.write);
            velocity.swap();

            gl!.uniform1i(splatUniforms.uTarget, dye.read.attach(0));
            gl!.uniform3f(splatUniforms.color, color.r, color.g, color.b);
            blit(dye.write);
            dye.swap();
        }

        function splatPointer(pointer: Pointer) {
            const dx = pointer.deltaX * mergedConfig.SPLAT_FORCE;
            const dy = pointer.deltaY * mergedConfig.SPLAT_FORCE;
            splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
        }

        function step(dt: number) {
            gl!.disable(gl!.BLEND);

            gl!.useProgram(curlProgram);
            gl!.uniform2f(
                curlUniforms.texelSize,
                velocity.texelSizeX,
                velocity.texelSizeY
            );
            gl!.uniform1i(curlUniforms.uVelocity, velocity.read.attach(0));
            blit(curl);

            gl!.useProgram(vorticityProgram);
            gl!.uniform2f(
                vorticityUniforms.texelSize,
                velocity.texelSizeX,
                velocity.texelSizeY
            );
            gl!.uniform1i(vorticityUniforms.uVelocity, velocity.read.attach(0));
            gl!.uniform1i(vorticityUniforms.uCurl, curl.attach(1));
            gl!.uniform1f(vorticityUniforms.curl, mergedConfig.CURL);
            gl!.uniform1f(vorticityUniforms.dt, dt);
            blit(velocity.write);
            velocity.swap();

            gl!.useProgram(divergenceProgram);
            gl!.uniform2f(
                divergenceUniforms.texelSize,
                velocity.texelSizeX,
                velocity.texelSizeY
            );
            gl!.uniform1i(
                divergenceUniforms.uVelocity,
                velocity.read.attach(0)
            );
            blit(divergence);

            gl!.useProgram(clearProgram);
            gl!.uniform1i(clearUniforms.uTexture, pressure.read.attach(0));
            gl!.uniform1f(clearUniforms.value, mergedConfig.PRESSURE);
            blit(pressure.write);
            pressure.swap();

            gl!.useProgram(pressureProgram);
            gl!.uniform2f(
                pressureUniforms.texelSize,
                velocity.texelSizeX,
                velocity.texelSizeY
            );
            gl!.uniform1i(pressureUniforms.uDivergence, divergence.attach(0));
            for (let i = 0; i < mergedConfig.PRESSURE_ITERATIONS; i++) {
                gl!.uniform1i(
                    pressureUniforms.uPressure,
                    pressure.read.attach(1)
                );
                blit(pressure.write);
                pressure.swap();
            }

            gl!.useProgram(gradientSubtractProgram);
            gl!.uniform2f(
                gradientSubtractUniforms.texelSize,
                velocity.texelSizeX,
                velocity.texelSizeY
            );
            gl!.uniform1i(
                gradientSubtractUniforms.uPressure,
                pressure.read.attach(0)
            );
            gl!.uniform1i(
                gradientSubtractUniforms.uVelocity,
                velocity.read.attach(1)
            );
            blit(velocity.write);
            velocity.swap();

            gl!.useProgram(advectionProgram);
            gl!.uniform2f(
                advectionUniforms.texelSize,
                velocity.texelSizeX,
                velocity.texelSizeY
            );
            if (!supportLinearFiltering) {
                gl!.uniform2f(
                    advectionUniforms.dyeTexelSize,
                    velocity.texelSizeX,
                    velocity.texelSizeY
                );
            }
            const velocityId = velocity.read.attach(0);
            gl!.uniform1i(advectionUniforms.uVelocity, velocityId);
            gl!.uniform1i(advectionUniforms.uSource, velocityId);
            gl!.uniform1f(advectionUniforms.dt, dt);
            gl!.uniform1f(
                advectionUniforms.dissipation,
                mergedConfig.VELOCITY_DISSIPATION
            );
            blit(velocity.write);
            velocity.swap();

            if (!supportLinearFiltering) {
                gl!.uniform2f(
                    advectionUniforms.dyeTexelSize,
                    dye.texelSizeX,
                    dye.texelSizeY
                );
            }
            gl!.uniform1i(advectionUniforms.uVelocity, velocity.read.attach(0));
            gl!.uniform1i(advectionUniforms.uSource, dye.read.attach(1));
            gl!.uniform1f(
                advectionUniforms.dissipation,
                mergedConfig.DENSITY_DISSIPATION
            );
            blit(dye.write);
            dye.swap();
        }

        function render() {
            gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
            gl!.enable(gl!.BLEND);

            gl!.useProgram(displayProgram);
            if (mergedConfig.SHADING) {
                gl!.uniform2f(
                    displayUniforms.texelSize,
                    1.0 / gl!.drawingBufferWidth,
                    1.0 / gl!.drawingBufferHeight
                );
            }
            gl!.uniform1i(displayUniforms.uTexture, dye.read.attach(0));
            blit(null);
        }

        // Event handlers
        function updatePointerMoveData(
            pointer: Pointer,
            posX: number,
            posY: number,
            color: { r: number; g: number; b: number }
        ) {
            pointer.prevTexcoordX = pointer.texcoordX;
            pointer.prevTexcoordY = pointer.texcoordY;
            pointer.texcoordX = posX / canvasWidth();
            pointer.texcoordY = 1.0 - posY / canvasHeight();
            pointer.deltaX = correctDeltaX(
                pointer.texcoordX - pointer.prevTexcoordX
            );
            pointer.deltaY = correctDeltaY(
                pointer.texcoordY - pointer.prevTexcoordY
            );
            pointer.moved =
                Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
            pointer.color = color;
        }

        function updatePointerDownData(
            pointer: Pointer,
            id: number,
            posX: number,
            posY: number
        ) {
            pointer.id = id;
            pointer.down = true;
            pointer.moved = false;
            pointer.texcoordX = posX / canvasWidth();
            pointer.texcoordY = 1.0 - posY / canvasHeight();
            pointer.prevTexcoordX = pointer.texcoordX;
            pointer.prevTexcoordY = pointer.texcoordY;
            pointer.deltaX = 0;
            pointer.deltaY = 0;
            pointer.color = generateColor();
        }

        const handleMouseMove = (e: MouseEvent) => {
            const pointer = pointers[0];
            const posX = scaleByPixelRatio(e.clientX);
            const posY = scaleByPixelRatio(e.clientY);
            updatePointerMoveData(pointer, posX, posY, pointer.color);
        };

        const handleMouseDown = (e: MouseEvent) => {
            const pointer = pointers[0];
            const posX = scaleByPixelRatio(e.clientX);
            const posY = scaleByPixelRatio(e.clientY);
            updatePointerDownData(pointer, -1, posX, posY);
        };

        const handleTouchMove = (e: TouchEvent) => {
            const touches = e.targetTouches;
            const pointer = pointers[0];
            for (let i = 0; i < touches.length; i++) {
                const posX = scaleByPixelRatio(touches[i].clientX);
                const posY = scaleByPixelRatio(touches[i].clientY);
                updatePointerMoveData(pointer, posX, posY, pointer.color);
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            const touches = e.targetTouches;
            const pointer = pointers[0];
            for (let i = 0; i < touches.length; i++) {
                const posX = scaleByPixelRatio(touches[i].clientX);
                const posY = scaleByPixelRatio(touches[i].clientY);
                updatePointerDownData(
                    pointer,
                    touches[i].identifier,
                    posX,
                    posY
                );
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("touchmove", handleTouchMove, false);
        window.addEventListener("touchstart", handleTouchStart);

        // Initialize
        resizeCanvas();
        initFramebuffers();

        let lastUpdateTime = Date.now();
        let colorUpdateTimer = 0.0;

        function update() {
            const now = Date.now();
            let dt = (now - lastUpdateTime) / 1000;
            dt = Math.min(dt, 0.016666);
            lastUpdateTime = now;

            if (resizeCanvas()) {
                initFramebuffers();
            }

            // Update colors
            colorUpdateTimer += dt * mergedConfig.COLOR_UPDATE_SPEED;
            if (colorUpdateTimer >= 1) {
                colorUpdateTimer = colorUpdateTimer % 1;
                pointers.forEach((p) => {
                    p.color = generateColor();
                });
            }

            // Apply inputs
            pointers.forEach((p) => {
                if (p.moved) {
                    p.moved = false;
                    splatPointer(p);
                }
            });

            step(dt);
            render();
            animationRef.current = requestAnimationFrame(update);
        }

        update();

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchstart", handleTouchStart);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [config]);

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none fixed inset-0 z-50 h-full w-full"
            style={{ touchAction: "none" }}
        />
    );
}
