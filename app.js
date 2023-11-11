import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, rotateX } from "../../libs/MV.js";
import {modelView, loadMatrix, multRotationX, multRotationY, multRotationZ, multScale, multTranslation, popMatrix, pushMatrix} from "../../libs/stack.js";

import * as CUBE from '../../libs/objects/cube.js';
import * as CYLINDER from '../../libs/objects/cylinder.js'
import * as TRIANGLES from '../../libs/objects/triangles.js'

const MODES = { ON: true, OFF: false }
var currentState = MODES.ON


let t1 = 8;
let l1 = 0.05;
let e1 = 0;
let t2 = 10;
let l2 = 0.05;
let e2 = 0;
let t3 = 12;
let e3 = 0;
let l3 = l1;
let t4 = t3/3;
let ag = 0;
let so = 0;
let rb = 0;
let eb = 0;
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

    let mProjection = ortho(-1*aspect,aspect, -1, 1, 0.01, 3);
    let mView = lookAt([2, 1.2, 1], [0, 0.6, 0], [0, 1, 0]);

    let zoom = 1.0;

    /** Model parameters */
   

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
                break;
            case '2':
                // Top view
                mView = lookAt([0,1.6,0],  [0,0.6,0], [-1000,0,-1]);
                break;
            case '3':
                // Right view
                mView = lookAt([1, 0.6, 0.], [0, 0.6, 0], [0, 1, 0]);
                break;
            case '4':
                mView = lookAt([2, 1.2, 1], [0, 0.6, 0], [0, 1, 0]);
                break;
            case 'r':
                zoom = 1.0;
                break;
            case 'w':
                ag = Math.max(0, ag - 0.005);
                break;
            case 's':
                ag = Math.min(t2*l2, ag + 0.005);
                break;
            case 'i':
                eb = Math.min((t1-1)*l2, eb + 0.005);;
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
                break;
            case 'ArrowRight':
                break;
            case 'ArrowUp':
                break;
            case 'ArrowDown':
                break;
            case '+':
                zoom /= 1.1;
                break;
            case '-':
                zoom *= 1.1;
                break;
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
                    CUBE.draw(gl, program, mode);
                popMatrix() 
            }
            else{
                pushMatrix()
                    multTranslation([0, scale*i, 0]);
                    multScale([l1, l1, l1]);
                    uploadModelView();
                    CUBE.draw(gl, program, mode);
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
                    multScale([l2, l2, l2]);
                    uploadModelView();
                    CUBE.draw(gl, program, mode);
                popMatrix() 
        }
    }

    function TopCraneAndClaw()
    {
        pushMatrix();
            TopCrane();
        popMatrix();
        Claw();
    }

    function TopCrane()
    { 
        pushMatrix();
            multTranslation([0, t2*l2+eb, 0]);
            multScale([0.15, l2, 0.15]);
            uploadModelView();
            CYLINDER.draw(gl, program, mode);
        popMatrix();
        for(let i = 0; i<3; i++){
            if(i == 0){
                pushMatrix();
                    multTranslation([0, t2*l2+eb+0.075, t4*l2-0.025]);
                    multRotationX(90);
                    multScale([0.001, t3*l3+t4*l3, 0.001]);
                    uploadModelView();
                    CUBE.draw(gl, program, mode);
                popMatrix();
            }
            if(i == 1){
                pushMatrix();
                    multTranslation([0.025, t2*l2+eb+0.025, t4*l2-0.025]);
                    multRotationX(90);
                    multScale([0.001, t3*l3+t4*l3, 0.001]);
                    uploadModelView();
                    CUBE.draw(gl, program, mode);
                popMatrix();
            }
            if(i == 2){
                pushMatrix();
                    multTranslation([-0.025, t2*l2+eb+0.025, t4*l2-0.025]);
                    multRotationX(90);
                    multScale([0.001, t3*l3+t4*l3, 0.001]);
                    uploadModelView();
                    CUBE.draw(gl, program, mode);
                popMatrix();
            }
        }
        drawTrianglesCrane();
        counterWeight();
    }

    function counterWeight(){
        pushMatrix()
            multTranslation([0,t2*l2+eb,-(t4-1)*l2])
            multScale([l2, l2, l2]);
            uploadModelView();
            CUBE.draw(gl, program, mode);
        popMatrix() 

    }

    function drawTrianglesCrane(){
        let z = 0;
        let i = 0;
        
        while(i!=t3){
            if(i == 0){
                pushMatrix();
                    multTranslation([0, t2*l2+eb+l2, 0]);
                    multScale([l2, l2, l2]);
                    uploadModelView();
                    TRIANGLES.draw(gl, program, mode);
                popMatrix();
                i++;
            }else{
                pushMatrix();
                    multTranslation([0, t2*l2+eb+l2, z+=l3]);
                    multScale([l2, l2, l2]);
                    uploadModelView();
                    TRIANGLES.draw(gl, program, mode);
                popMatrix();
                i++;
            }
        }
        z = 0;
        for(let x = 0; x<=t4;x++){
            pushMatrix();
                multTranslation([0, t2*l2+eb+l2, z-=l3]);
                multScale([l2, l2, l2]);
                uploadModelView();
                TRIANGLES.draw(gl, program, mode);
            popMatrix();
        }

    }
    function Claw()
    {
        multRotationX(180)
        multTranslation([0,0, so]);
        // Base
            pushMatrix();
                multTranslation([0, -(t2*l2+eb+0.025), -(t3-1)*l3]);
                multScale([l2, 0.01, l2]);
                uploadModelView();
                CUBE.draw(gl, program, mode);
            popMatrix();
        // Cylinder 
                //multTranslation([0,ag, 0]);
                if(ag == 0){
                    pushMatrix();
                        multTranslation([0,-(t2*l2+eb), -(t3-1)*l3]);
                        multScale([0.001, l2+ag, 0.001]);
                        uploadModelView();
                        CYLINDER.draw(gl, program, mode);
                    popMatrix();
                }else{
                    pushMatrix();
                        multTranslation([0,-(t2*l2+eb), -(t3-1)*l3]);
                        multTranslation([0,((l2+ag)/2)-0.025,0]);
                        multScale([0.001, l2+ag, 0.001]);
                        uploadModelView();
                        CYLINDER.draw(gl, program, mode);
                    popMatrix();
                }
    }

    function RobotArm() 
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
        for(let i = 0; i < aspect*zoom; i+=0.1){
            for(let j = 0; j < aspect*zoom; j+=0.1){
                pushMatrix();
                    multTranslation([(-aspect*zoom)/2,0,(-aspect*zoom)/2]);
                    multTranslation([i,0,j]);
                    multScale([0.1,0,0.1]);
                    uploadModelView();
                    CUBE.draw(gl, program, mode);
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

        // Load the ModelView matrix with the Worl to Camera (View) matrix
        loadMatrix(mView);

        //Claw();
        //TopCrane();
        //TopCraneAndClaw();
        //BaseCrane(t2,l2);
        RobotArm(t2,l2);
        DoFloor();

    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))
