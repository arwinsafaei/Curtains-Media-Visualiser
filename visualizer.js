const mediaAudio = document.getElementById("audio");
const canvas = document.getElementById("visualiser");
const visualArea = document.querySelector(".visual-area");

const gl = canvas.getContext("webgl", {
    antialias: true,
    alpha: false
});

if (!gl) {
    console.error("WebGL is not supported by this browser.");
} else {
    const vertexShaderSource = `
        attribute vec2 position;
        varying vec2 uv;
        
        void main() {
            uv = position * 0.5 + 0.5;
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    const fragmentShaderSource = `
        precision highp float;

        varying vec2 uv;

        uniform vec2 resolution;
        uniform float time;
        uniform float bass;
        uniform float mid;
        uniform float treble;

        #define PI 3.14159265359

        void main() {
            vec2 p = (uv - 0.5) * 2.0;
            p.x *= resolution.x / resolution.y;

            vec2 centre = vec2(0.0);

            float t = time * 0.25;
            float energy = bass * 0.9 + mid * 0.4;

            for (int i = 0; i < 5; i++) {
                float fi = float(i);

                p += 0.13 * sin(
                    p.yx * (2.0 + fi * 0.35)
                    + t + 1.4 + fi * 1.7
                ) * (0.5 + energy * 1.5);
            }

            float radius = length(p);
            float angle = atan(p.y, p.x);

            float pattern = sin(
                angle * (9.0 + bass * 12.0)
                + 4.0 / (radius + 0.12)
                - t * 4.5
            );

            float glow = 0.5 + 0.5 * sin(pattern * 2.0);

            vec3 colour = 0.5 + 0.5 * cos(
                vec3(0.0, 2.0, 4.0)
                + pattern
                + t
                + treble * 2.0
            );

            colour *= 0.65 + glow * 1.2;
            colour += vec3(0.12, 0.2, 0.45) * glow;

            colour += vec3(0.3, 0.15, 0.6)
                * exp(-radius * 2.5)
                * (0.5 + energy * 2.0);
            
            colour *= 1.0 + bass * 1.5;
            
            gl_FragColor = vec4(colour, 1.0);
        }
    `;

    function createShader(type, source) {
        const shader = gl.createShader(type);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);

    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (vertexShader && fragmentShader) {
        const program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
        } else {
            gl.useProgram(program);

            const vertices = new Float32Array([
                -1, -1,
                 1, -1,
                -1,  1,
                 1,  1
            ]);

            const buffer = gl.createBuffer();

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            const position = gl.getAttribLocation(program, "position");

            gl.enableVertexAttribArray(position);
            gl.vertexAttribPointer(
                position,
                2,
                gl.FLOAT,
                false,
                0,
                0
            );

            const uniforms = {
                resolution: gl.getUniformLocation(program, "resolution"),
                time: gl.getUniformLocation(program, "time"),
                bass: gl.getUniformLocation(program, "bass"),
                mid: gl.getUniformLocation(program, "mid"),
                treble: gl.getUniformLocation(program, "treble")
            };

            let audioContext;
            let analyser;
            let frequencyData;

            let bass = 0;
            let mid = 0;
            let treble = 0;

            function resizeCanvas() {
                const dpr = Math.min(window.devicePixelRatio || 1, 2);

                const width = Math.floor(canvas.clientWidth * dpr);
                const height = Math.floor(canvas.clientHeight * dpr);

                if (canvas.width !== width || canvas.height !== height) {
                    canvas.width = width;
                    canvas.height = height;

                    gl.viewport(0, 0, width, height);
                    gl.uniform2f(uniforms.resolution, width, height);
                }
            }

            function averageFrequency(start, end) {
                let total = 0;

                for (let i = start; i < end; i++) {
                    total += frequencyData[i];
                }

                return total / (end - start) / 255;
            }

            function setupAudio() {
                if (audioContext) {
                    return audioContext.resume();
                }

                audioContext = new AudioContext();

                analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;
                analyser.smoothingTimeConstant = 0.8;

                const source = audioContext.createMediaElementSource(mediaAudio);

                source.connect(analyser);
                analyser.connect(audioContext.destination);

                frequencyData = new Uint8Array(analyser.frequencyBinCount);

                return audioContext.resume();
            }

            function render(time) {
                resizeCanvas();

                if (analyser && !mediaAudio.paused) {
                    analyser.getByteFrequencyData(frequencyData);

                    bass += (averageFrequency(0, 8) - bass) * 0.2;
                    mid += (averageFrequency(8, 80) - mid) * 0.2;
                    treble += (averageFrequency(80, 300) - treble) * 0.2;
                }

                gl.uniform1f(uniforms.time, time * 0.001);
                gl.uniform1f(uniforms.bass, bass);
                gl.uniform1f(uniforms.mid, mid);
                gl.uniform1f(uniforms.treble, treble);

                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

                requestAnimationFrame(render);
            }

            mediaAudio.addEventListener("play", async () => {
                try {
                    await setupAudio();
                    visualArea.classList.add("visualizing");
                } catch (error) {
                    console.error("Could not start audio visualisation:", error);
                }
            });

            mediaAudio.addEventListener("pause", () => {
                visualArea.classList.remove("visualizing");
            });

            window.addEventListener("resize", resizeCanvas);

            resizeCanvas();
            requestAnimationFrame(render);
        }
    }
}