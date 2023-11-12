import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, rotateX, rotateY, mult } from "../../libs/MV.js";
import {modelView, loadMatrix, multRotationX, multRotationY, multScale, multTranslation, popMatrix, pushMatrix} from "../../libs/stack.js";

import * as CUBE from '../../libs/objects/cube.js';
import * as CYLINDER from '../../libs/objects/cylinder.js'
import * as TRIANGLES from '../../libs/objects/triangles.js'

const MODES = { ON: true, OFF: false }
var currentState = MODES.ON


let t1 = 8;
let l1 = 0.05;
let e1 = 0;
let t2 = 10;
let l2 = 0.045;
let e2 = 0;
let t3 = 12;
let e3 = 0;
let l3 = l1;
let t4 = t3/3;
let ag = 0;
let so = 0;
let rb = 0;
let eb = 0;
let theta = 32;
let gamma = 22;
function toggleMode(state){
    state = !state;
    return state;
}

function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    /** @type WebGL2RenderingContext */
    let gl = setupWebGL(canvas);

    // Drawing mode (gl.LINES or gl.TRIANGLES)
    let mode = gl.LINES;

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    let axonometricActive = true;

    let mProjection = ortho(-1*aspect,aspect, -1, 1, 0.01, 3);
    let mView = mult(mult(lookAt([2, 1.2, 1], [0, 0.6, 0], [0, 1, 0]),rotateX(gamma)),rotateY(theta));

    let zoom = 1.0;

    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    document.onkeydown = function(event) {
        switch(event.key) {
            case '0':
                if (currentState == MODES.ON){
                    mode = gl.TRIANGLES;
                    currentState= toggleMode(currentState);
                }  
                else{
                    mode = gl.LINES;
                    currentState= toggleMode(currentState);
                }
                break;
            case '1':
                // Front view
                mView = lookAt([0,0.6,1], [0,0.6,0], [0,1,0]);
                axonometricActive = false;
                break;
            case '2':
                // Top view
                mView = lookAt([0,1.6,0],  [0,0.6,0], [-1000,0,-1]);
                axonometricActive = false;
                break;
            case '3':
                // Right view
                mView = lookAt([1, 0.6, 0.], [0, 0.6, 0], [0, 1, 0]);
                axonometricActive = false;
                break;
            case '4':
                axonometricActive = true;
                break;
            case 'r':
                zoom = 1.0;
                theta = 32;
                gamma = 22;
                break;
            case 'w':
                ag = Math.max(0, ag - 0.005);
                break;
            case 's':
                ag = Math.min(t2*l2, ag + 0.005);
                break;
            case 'i':
                eb = Math.min((t1-1)*l1, eb + 0.005);;
                break;
            case 'k':
                eb = Math.max(0, eb - 0.005);
                break;
            case 'j':
                rb -= 1;
                break;
            case 'l':
                rb += 1;
                break;
            case 'a':
                so = Math.max(0, so - 0.005);
                break;
            case 'd':
                so = Math.min(t3*l3-0.15, so + 0.005);
                break;
            case 'ArrowLeft':
                theta++;
                break;
            case 'ArrowRight':
                theta--;
                break;
            case 'ArrowUp':
                gamma++;
                break;
            case 'ArrowDown':
                gamma--;
                break;
        }
    }

    document.onwheel = function(event) {
        if (event.deltaY < 0) {
            zoom /= 1.1;
        } else {
            zoom *= 1.1;
        }
    }

    gl.clearColor(0, 0, 0, 1.0);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test

    TRIANGLES.init(gl);
    CUBE.init(gl);
    CYLINDER.init(gl);

    window.requestAnimationFrame(render);


    function resize_canvas(event)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);
        mProjection = ortho(-aspect*zoom,aspect*zoom, -zoom, zoom,0.01,3);
    }

    function uploadProjection()
    {
        uploadMatrix("mProjection", mProjection);
    }

    function uploadModelView()
    {
        uploadMatrix("mModelView", modelView());
    }

    function uploadMatrix(name, m) {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, name), false, flatten(m));
    }

    function BaseCrane(t2,l2)
    {
        let scale = l1;
        for(let i = 0; i<t1; i++){
            if(i == 0){
                pushMatrix()
                    multScale([l1, l1, l1]);
                    uploadModelView();
                    const cColor = gl.getUniformLocation(program, "vNormal");
                    gl.uniform3f(cColor, 1.0,1.0,0.0);
                    CUBE.draw(gl, program, gl.LINES);
                popMatrix() 
            }
            else{
                pushMatrix()
                    multTranslation([0, scale*i, 0]);
                    multScale([l1, l1, l1]);
                    uploadModelView();
                    CUBE.draw(gl, program, gl.LINES);
                popMatrix() 
            }
        }
        drawCraneRest(t2,l2);
    }

    function drawCraneRest(t2,l2){
        let scale = l1;
        for(let i = 0; i<t2; i++){
                pushMatrix()
                    multTranslation([0, scale*i, 0]);
                    multTranslation([0, eb, 0]);
                    multScale([l2, l1, l2]);
                    uploadModelView();
                    CUBE.draw(gl, program, gl.LINES);
                popMatrix() 
        }
    }

    function TopCraneAndClaw()
    {
        TopCrane();
        Claw();
    }

    function TopCrane()
    { 
        pushMatrix();
            multTranslation([0, t2*l1+eb, 0]);
            multScale([0.15, l1, 0.15]);
            uploadModelView();
            const cColor = gl.getUniformLocation(program, "vNormal");
            gl.uniform3f(cColor, 0.5,0.5,0.5);
            CYLINDER.draw(gl, program, mode);
        popMatrix();
        for(let i = 0; i<3; i++){
            if(i == 0){
                pushMatrix();
                    multTranslation([0, t2*l1+eb+0.075, t4*l1-0.025]);
                    multRotationX(90);
                    multScale([0.001, t3*l3+t4*l3, 0.001]);
                    uploadModelView();
                    const cColor = gl.getUniformLocation(program, "vNormal");
                    gl.uniform3f(cColor, 1.0,1.0,0.0);
                    CUBE.draw(gl, program, gl.LINES);
                popMatrix();
            }
            if(i == 1){
                pushMatrix();
                    multTranslation([0.025, t2*l1+eb+0.025, t4*l1-0.025]);
                    multRotationX(90);
                    multScale([0.001, t3*l3+t4*l3, 0.001]);
                    uploadModelView();
                    CUBE.draw(gl, program, gl.LINES);
                popMatrix();
            }
            if(i == 2){
                pushMatrix();
                    multTranslation([-0.025, t2*l1+eb+0.025, t4*l1-0.025]);
                    multRotationX(90);
                    multScale([0.001, t3*l3+t4*l3, 0.001]);
                    uploadModelView();
                    CUBE.draw(gl, program, gl.LINES);
                popMatrix();
            }
        }
        drawTrianglesCrane();
        counterWeight();
    }

    function counterWeight(){
        pushMatrix()
            multTranslation([0,t2*l1+eb,-(t4-1)*l1])
            multScale([l1, l1, l1]);
            uploadModelView();
            const cColor = gl.getUniformLocation(program, "vNormal");
            gl.uniform3f(cColor, 1.0,1.0,1.0);
            CUBE.draw(gl, program, mode);
        popMatrix() 

    }

    function drawTrianglesCrane(){
        let z = 0;
        let i = 0;
        
        while(i!=t3){
            if(i == 0){
                pushMatrix();
                    multTranslation([0, t2*l1+eb+l1, 0]);
                    multScale([l1, l1, l1]);
                    uploadModelView();
                    TRIANGLES.draw(gl, program, gl.LINES);
                popMatrix();
                i++;
            }else{
                pushMatrix();
                    multTranslation([0, t2*l1+eb+l1, z+=l3]);
                    multScale([l1, l1, l1]);
                    uploadModelView();
                    TRIANGLES.draw(gl, program, gl.LINES);
                popMatrix();
                i++;
            }
        }
        z = 0;
        for(let x = 0; x<=t4;x++){
            pushMatrix();
                multTranslation([0, t2*l1+eb+l1, z-=l3]);
                multScale([l1, l1, l1]);
                uploadModelView();
                TRIANGLES.draw(gl, program, gl.LINES);
            popMatrix();
        }

    }
    function Claw()
    {
        multRotationX(180)
        multTranslation([0,0, so]);
        // Base
            pushMatrix();
                multTranslation([0, -(t2*l1+eb+l1/2.5), -(t3-1)*l3]);
                multScale([l1, 0.01, l1]);
                uploadModelView();
                const cColor = gl.getUniformLocation(program, "vNormal");
                gl.uniform3f(cColor, 1.0,0.0,0.0);
                CUBE.draw(gl, program, mode);
            popMatrix();
        // Cylinder 
                //multTranslation([0,ag, 0]);
                if(ag == 0){
                    pushMatrix();
                        multTranslation([0,-(t2*l1+eb-(l1/5)), -(t3-1)*l3]);
                        multScale([0.001, l1+ag, 0.001]);
                        uploadModelView();
                        const cColor = gl.getUniformLocation(program, "vNormal");
                        gl.uniform3f(cColor, 1.0,1.0,1.0);
                        CYLINDER.draw(gl, program, gl.TRIANGLES);
                    popMatrix();
                }else{
                    pushMatrix();
                        multTranslation([0,-(t2*l1+eb-(l1/5)), -(t3-1)*l3]);
                        multTranslation([0,((l1+ag)/2)-0.025,0]);
                        multScale([0.001, l1+ag, 0.001]);
                        uploadModelView();
                        const cColor = gl.getUniformLocation(program, "vNormal");
                        gl.uniform3f(cColor, 1.0,1.0,1.0);
                        CYLINDER.draw(gl, program, gl.TRIANGLES);
                    popMatrix();
                }
    }

    function FullCrane() 
    {   
        pushMatrix();
            BaseCrane(t2,l2);
        popMatrix();
        pushMatrix();
            multRotationY(rb);
            TopCraneAndClaw();
        popMatrix();
    }

    function DoFloor(){
        let numFloor = 1.3
        let adjust = 0.05;
        let parity = true;
        for(let i = 0; i < numFloor; i+=0.1){
            for(let j = 0; j < numFloor ; j+=0.1){
                pushMatrix();
                    multTranslation([-numFloor/2 + adjust,0,-numFloor/2+ adjust]);
                    multTranslation([i,0,j]);
                    multScale([0.1,0.01,0.1]);
                    uploadModelView();
                    if(parity){
                        const cColor = gl.getUniformLocation(program, "vNormal");
                        gl.uniform3f(cColor, 0.6,0.6,0.6);
                        parity = false;
                    }
                    else{
                        const cColor = gl.getUniformLocation(program, "vNormal");
                        gl.uniform3f(cColor, 1.0,1.0,1.0);
                        parity = true;
                    }
                    CUBE.draw(gl, program, gl.TRIANGLES);
                popMatrix();
            }
        }        
    }

    function render()
    {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        // Send the mProjection matrix to the GLSL program
        mProjection = ortho(-aspect*zoom,aspect*zoom, -zoom, zoom,0.01,10);
        uploadProjection(mProjection);
        if(axonometricActive)
            mView = mult(mult(lookAt([0, 0,1], [0,0,0], [0,1,0]),rotateX(gamma)),rotateY(theta));

        // Load the ModelView matrix with the Worl to Camera (View) matrix
        loadMatrix(mView);

        DoFloor();
        //Claw();
        //TopCrane();
        //TopCraneAndClaw();
        //BaseCrane(t2,l2);
        pushMatrix()
            multTranslation([0,l1/2,0]);
            FullCrane(t2,l2);
        popMatrix()
        

    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))
