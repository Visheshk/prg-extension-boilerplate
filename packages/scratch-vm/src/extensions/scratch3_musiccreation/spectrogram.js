const Clone = require('../../util/clone');
const log = require('../../util/log');
const Cast = require('../../util/cast');
const Color = require('../../util/color');
const RenderedTarget = require('../../sprites/rendered-target');
const StageLayering = require('../../engine/stage-layering');

const symbols = require('./symbols');
const { updateVariableIdentifiers } = require('../../util/variable-util');

class Spectrogram {
    constructor (runtime) {
        this.runtime = runtime;

        /**
         * The ID of the renderer Skin corresponding to the pen layer.
         * @type {int}
         * @private
         */
        this._penSkinId = -1;

        /**
         * The ID of the renderer Drawable corresponding to the pen layer.
         * @type {int}
         * @private
         */
        this._penDrawableId = -1;
        this.black = '0x000000';
        this.blue = '0x00008B';
        this.yellow = '0xffff00';

        this.noteList = [];

        this.axisStartX = -200;
        this.axisStartY = -150;
        this.xAxisLength = 400;
        this.yAxisLength = 300;

        this._onTargetCreated = this._onTargetCreated.bind(this);
        this.runtime.on('targetWasCreated', this._onTargetCreated);

        this._onTargetMoved = this._onTargetMoved.bind(this);

        harmonics = {
            "Piano": [[1,1], [2, 0.5]],
            "Guitar": [[1,1], [2, 0.25]],
            "Bass": [[1,1], [3, 0.5]],
            "Cello": [[1,1], [4, 0.5]],
            "Saxophone": [[1,1], [5, 0.5]],
            "Clarinet": [[1,1], [6, 0.5]],
            "Synth":[[1,1]] 
        }
    }

    /**
     * The key to load & store a target's music-related state.
     * @type {string}
     */
    static get VIZ_STATE_KEY () {
        return 'Scratch.musicviz';
    }

    static get DEFAULT_PEN_STATE () {
        return {
            penDown: false,
            color: 66.66,
            saturation: 100,
            brightness: 100,
            transparency: 0,
            _shade: 50, // Used only for legacy `change shade by` blocks
            penAttributes: {
                color4f: [0, 0, 1, 1],
                diameter: 1
            }
        };
    }

    /**
     * The minimum and maximum allowed pen size.
     * The maximum is twice the diagonal of the stage, so that even an
     * off-stage sprite can fill it.
     * @type {{min: number, max: number}}
     */
    static get PEN_SIZE_RANGE () {
        return {min: 1, max: 1200};
    }

        /**
     * When a music-playing Target is cloned, clone the music state.
     * @param {Target} newTarget - the newly created target.
     * @param {Target} [sourceTarget] - the target used as a source for the new clone, if any.
     * @listens Runtime#event:targetWasCreated
     * @private
     */
    _onTargetCreated (newTarget, sourceTarget) {
        if (sourceTarget) {
            const penState = sourceTarget.getCustomState(Spectrogram.VIZ_STATE_KEY);
            if (penState) {
                newTarget.setCustomState(Spectrogram.VIZ_STATE_KEY, Clone.simple(penState));
                if (penState.penDown) {
                    newTarget.addListener(RenderedTarget.EVENT_TARGET_MOVED, this._onTargetMoved);
                }
            }
        }
    }

    _onTargetMoved (target, oldX, oldY, isForce) {
        // Only move the pen if the movement isn't forced (ie. dragged).
        if (!isForce) {
            const penSkinId = this._getPenLayerID();
            if (penSkinId >= 0) {
                const penState = this._getPenState(target);
                this.runtime.renderer.penLine(penSkinId, penState.penAttributes, oldX, oldY, target.x, target.y);
                this.runtime.requestRedraw();
            }
        }
    }

    _getPenLayerID () {
        if (this._penSkinId < 0 && this.runtime.renderer) {
            this._penSkinId = this.runtime.renderer.createPenSkin();
            this._penDrawableId = this.runtime.renderer.createDrawable(StageLayering.PEN_LAYER);
            this.runtime.renderer.updateDrawableProperties(this._penDrawableId, {skinId: this._penSkinId});
        }
        return this._penSkinId;
    }

    _getPenState (target) {
        let penState = target.getCustomState(Spectrogram.VIZ_STATE_KEY);
        if (!penState) {
            penState = Clone.simple(Spectrogram.DEFAULT_PEN_STATE);
            target.setCustomState(Spectrogram.VIZ_STATE_KEY, penState);
        }
        return penState;
    }

    testSpectViz (noteList, args, util) {
        this.setPenColorToColor(this.black, util);
        this.noteList = noteList;
        this.clear();
        this.drawAxes(args, util);
        this.drawSpectrogram(args, util);

    }

    drawSpectrogram(args, util) {
        freqs = [];
        amps = [];
        durs = [];
        d = 0;
        this.setPenColorToColor(this.yellow, util);
        for (i in this.noteList) {
            midi = this.noteList[i][0];
            inst = this.noteList[i][2];
            dur = this.noteList[i][1];
            harmonic = harmonics[inst];
            pitch = 2**((midi - 69)/12)*440;
            for (i in harmonic) {
                k = harmonic[i][0];
                coeff = harmonic[i][1];
                hPitch = pitch*k;
                freqs.push(hPitch);
                amps.push(coeff);
                durs.push([d, d+dur])

            }
            d += dur;
        }
        maxDuration = d;
        maxFreq = Math.max( ...freqs );
        for (i in freqs) {
            f = freqs[i]/(maxFreq+5);
            d = durs[i];
            start = d[0];
            end = d[1];
            start = start/maxDuration;
            end = end/maxDuration;

            this.penUp(args, util);
            util.target.setXY(this.axisStartX + start*this.xAxisLength, this.axisStartY+this.yAxisLength*f);
            this.penDown(args, util);
            util.target.setXY(this.axisStartX + end*this.xAxisLength, this.axisStartY+this.yAxisLength*f);
            this.penUp(args, util);  

        }
    }

    fillInSpec(args, util){
        this.setPenColorToColor(this.blue, util);
        for (var i = this.axisStartY+1; i <this.axisStartY+this.yAxisLength; i++) {
            log.log(i);
            this.penUp(args, util);
            util.target.setXY(this.axisStartX+1, i);
            this.penDown(args, util);
            util.target.setXY(this.axisStartX+this.xAxisLength, i);
            this.penUp(args, util);
        }
    }

    drawAxes(args, util) {
        util.target.setXY(this.axisStartX, this.axisStartY + this.yAxisLength);
        this.penDown(args, util);
        util.target.setXY(this.axisStartX, this.axisStartY);
        this.penUp(args, util);
        util.target.setXY(this.axisStartX, this.axisStartY);
        this.penDown(args, util);
        util.target.setXY(this.axisStartX+this.xAxisLength, this.axisStartY);
        this.penUp(args, util);
        this.fillInSpec(args, util);
    }

    penUp (args, util) {
        const penState = this._getPenState(util.target);
        if (penState.penDown) {
            penState.penDown = false;
            util.target.removeListener(RenderedTarget.EVENT_TARGET_MOVED, this._onTargetMoved);
        }
    }

    penDown (args, util, penSkinId) {
        const penState = this._getPenState(util.target);
        if (!penState.penDown) {
            penState.penDown = true;
            util.target.addListener(RenderedTarget.EVENT_TARGET_MOVED, this._onTargetMoved);
        }

        penSkinId = this._getPenLayerID();
        if (penSkinId >= 0) {
            this.runtime.renderer.penPoint(penSkinId, penState.penAttributes, util.target.x, util.target.y);
            this.runtime.requestRedraw();
        }
    }

    /**
     * The pen "set pen color to {color}" block sets the pen to a particular RGB color.
     * The transparency is reset to 0.
     * @param {object} args - the block arguments.
     *  @property {int} COLOR - the color to set, expressed as a 24-bit RGB value (0xRRGGBB).
     * @param {object} util - utility object provided by the runtime.
     */
    setPenColorToColor (newColor, util) {
        const penState = this._getPenState(util.target);
        const rgb = Cast.toRgbColorObject(newColor);
        const hsv = Color.rgbToHsv(rgb);
        penState.color = (hsv.h / 360) * 100;
        penState.saturation = hsv.s * 100;
        penState.brightness = hsv.v * 100;
        if (rgb.hasOwnProperty('a')) {
            penState.transparency = 100 * (1 - (rgb.a / 255.0));
        } else {
            penState.transparency = 0;
        }

        // Set the legacy "shade" value the same way scratch 2 did.
        penState._shade = penState.brightness / 2;

        this._updatePenColor(penState);
    }

    /**
     * Update the cached color from the color, saturation, brightness and transparency values
     * in the provided PenState object.
     * @param {PenState} penState - the pen state to update.
     * @private
     */
    _updatePenColor (penState) {
        const rgb = Color.hsvToRgb({
            h: penState.color * 360 / 100,
            s: penState.saturation / 100,
            v: penState.brightness / 100
        });
        penState.penAttributes.color4f[0] = rgb.r / 255.0;
        penState.penAttributes.color4f[1] = rgb.g / 255.0;
        penState.penAttributes.color4f[2] = rgb.b / 255.0;
        penState.penAttributes.color4f[3] = this._transparencyToAlpha(penState.transparency);
    }

    /**
     * Convert a pen transparency value to an alpha value.
     * Alpha ranges from 0 to 1, where 0 is transparent and 1 is opaque.
     * Transparency ranges from 0 to 100, where 0 is opaque and 100 is transparent.
     * @param {number} transparency - the input transparency value.
     * @returns {number} the alpha value.
     * @private
     */
    _transparencyToAlpha (transparency) {
        return 1.0 - (transparency / 100.0);
    }

    /**
     * The pen "clear" block clears the pen layer's contents.
     */
    clear () {
        penSkinId = this._getPenLayerID();
        if (penSkinId >= 0) {
            this.runtime.renderer.penClear(penSkinId);
            this.runtime.requestRedraw();
        }
    }

}

module.exports = Spectrogram;