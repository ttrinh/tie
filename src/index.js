import React from 'react';
import { findDOMNode } from 'react-dom';
import PropTypes from 'prop-types';
import MdCreate from 'react-icons/lib/md/create';

import Buttons from './Subs/Buttons';
import { findParentByClass, calcInputBoxStyle, getAutoGrowStyle } from './helpers';
import { Container, InputBox, Label, Hint } from './style';


/**
 * React component for editing text inline.
 *
 * ###### Features
 * - Simple & clean.
 * - No interference on the current textflow.
 * - Autogrow text input height
 * - Keyboard & Tab friendly (tab around and see).
 * - Simple theme customization.
 * - Format-able text input.
 * - Support presentational element as String or Component. However, value must be string.
 */
class ReactInlinese extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: props.value || '',
            show: false,
            inputStyle: {},
            iconStyle: {},
        };

        this.hover = this.hover.bind(this);
        this.switch = this.switch.bind(this);
        this.submit = this.submit.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.clickOutside = this.clickOutside.bind(this);
        this.autoGrowHeight = this.autoGrowHeight.bind(this);
        this.stopListeningOutclick = this.stopListeningOutclick.bind(this);
        this.startListeningOutclick = this.startListeningOutclick.bind(this);
    }

    componentDidMount() {
        this.node = findDOMNode(this);
    }

    componentWillUnmount() {
        this.stopListeningOutclick();
    }

    onChange(e) {
        const value = e.target.value;

        if (this.props.formatter) {
            const formattedValue = this.props.formatter.call(null, value);

            if (typeof formattedValue !== 'string') {
                console.warn('ReactInlinese: formatter function must return a string value');
                return;
            }

            this.setState({ value: formattedValue });
            this.autoGrowHeight();
            return;
        }

        this.setState({ value });
        this.autoGrowHeight();
    }

    onKeyDown(e) {
        if (e.keyCode === 13 && !e.shiftKey) this.submit(); // enter
        // escape or tab
        if (e.keyCode === 27 || e.keyCode === 9) {
            this.setState({ value: this.props.value }); // reset
            this.switch();
        }
    }

    // calculate the input styles.
    setInputStyle(element) {
        if (this.state.show) return;
        const node = findParentByClass(element, 'rie');
        this.setState({
            inputStyle: calcInputBoxStyle(node),
        });
    }

    autoGrowHeight() {
        const textareaAutoGrowStyle = getAutoGrowStyle(this.textareaClone, this.state.inputStyle);
        this.setState({ inputStyle: textareaAutoGrowStyle });
    }

    startListeningOutclick() { document.addEventListener('click', this.clickOutside, false); }
    stopListeningOutclick() { document.removeEventListener('click', this.clickOutside, false); }
    clickOutside(e) { if (!this.node.contains(e.target)) this.switch(); }

    switch(e) {
        if (this.props.disabled) return;

        // Entering edit mode.
        // Add dom listener for click outside
        // Calculate Input Box style and set value
        if (!this.state.show) {
            this.startListeningOutclick();

            if (e) {
                this.setInputStyle(e.target);
                this.setState({ value: this.props.value });
            }

        // Not in edit mode. Remove the listener
        } else {
            this.stopListeningOutclick();
        }

        this.setState({ show: !this.state.show });
    }

    submit() {
        // no change
        if (this.state.value === this.props.value) {
            this.switch();
            return;
        }

        this.setState({ value: this.state.value.trim() });
        this.props.onSubmit(this.state.value);
        this.switch();
    }

    hover(e) {
        const node = e.target;
        const height = node.offsetHeight;
        if (!height) return;

        this.setState({
            iconStyle: {
                top: height - 22,
            },
        });
    }

    render() {
        const {
            value, onSubmit, disabled, submitText, cancelText, style,
            placeholder, primaryColor, secondaryColor, roundness,
            hoverStyleString, showButtons, showEditIcon, children,
        } = this.props;

        if (typeof value !== 'string' || !onSubmit) {
            return null;
        }

        return (
            <Container style={style}>
                <Label
                    className="rie"
                    onClick={this.switch}
                    tabIndex={disabled ? '' : '0'}
                    onFocus={this.switch}
                    onMouseEnter={this.hover}
                    style={style}
                    hoverStyleString={disabled ? 'cursor: inherit;' : hoverStyleString}
                >
                    {children}
                </Label>

                {
                    !disabled && showEditIcon && !this.state.show &&
                    <span className="rie-edit-indicator" style={this.state.iconStyle}>
                        <MdCreate size={14} />
                    </span>
                }

                <InputBox
                    className={this.state.show ? 'rie-show' : ''}
                    color={primaryColor}
                    roundness={roundness}
                >
                    {
                        showButtons &&
                        <Buttons
                            submit={this.submit}
                            cancel={this.switch}
                            bgColor={primaryColor}
                            textColor={secondaryColor}
                            submitText={submitText}
                            cancelText={cancelText}
                            roundness={roundness}
                        />
                    }

                    {
                        this.state.show &&
                        <span
                            className="textarea-clone"
                            style={this.state.inputStyle}
                            ref={(node) => { this.textareaClone = node; }}
                        >
                            {this.state.value}
                        </span>
                    }
                    {
                        this.state.show &&
                        <textarea
                            tabIndex="-1"
                            type="text"
                            placeholder={placeholder}
                            onKeyDown={this.onKeyDown}
                            onChange={this.onChange}
                            value={this.state.value}
                            ref={input => input && input.focus()}
                            style={this.state.inputStyle}
                        />
                    }

                    <Hint color={primaryColor}>
                        <span><b>Enter</b>Apply</span>
                        <span><b>Esc</b>Cancel</span>
                        <span><b>Shift+Enter</b>New Line</span>
                    </Hint>
                </InputBox>

            </Container>
        );
    }
}

ReactInlinese.propTypes = {

    /** Main value */
    value: PropTypes.string.isRequired,

    /** Process function when the text is submit */
    onSubmit: PropTypes.func.isRequired,

    /** Placeholder */
    placeholder: PropTypes.string,

    /** Disable editable */
    disabled: PropTypes.bool,

    /** Formatter. Acticate on value changed and pass down value as argument */
    formatter: PropTypes.func,

    /** Share style for Container and text wrapper */
    style: PropTypes.object,

    /** Primary color. */
    primaryColor: PropTypes.string,

    /** Secondary color. Used for the buttons' text color */
    secondaryColor: PropTypes.string,

    /** Overall roundness, border-radius */
    roundness: PropTypes.string,

    /** Submit text for the input. */
    submitText: PropTypes.string,

    /** Cancel text for the input. */
    cancelText: PropTypes.string,

    /** Show edit indicator when the text is hovered. It's useful when the children element is a button or icon */
    showEditIcon: PropTypes.bool,

    /** Show Input Box buttons */
    showButtons: PropTypes.bool,

    /** STRING: Hover style */
    hoverStyleString: PropTypes.string,

    /** Representational display String or Component */
    children: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.string,
    ]),
};

ReactInlinese.defaultProps = {
    submitText: 'apply',
    cancelText: 'cancel',
    placeholder: '',
    style: {},
    disabled: false,
    showEditIcon: true,
    showButtons: true,
    primaryColor: '#555',
    secondaryColor: 'white',
    roundness: '3px',
    hoverStyleString: 'border-bottom: 1px dashed rgba(0,0,0,.2);',
};

export default ReactInlinese;
