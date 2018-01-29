import React from "react"
import { storiesOf } from "@storybook/react"
import { action } from "@storybook/addon-actions"
import { Task } from "../src/Task"
import Checkbox from "../src/Checkbox"

class StatefulCheckbox extends React.Component {
  state = { isChecked: false }

  render() {
    return (
      <div style={{ width: "40px", height: "40px", background: "white" }}>
        <Checkbox
          {...this.props}
          checked={this.state.isChecked}
          onChange={ev =>
            this.setState({
              isChecked: ev.currentTarget.checked
            })
          }
        />
      </div>
    )
  }
}

storiesOf("Checkbox", module).add("clickable", () => <StatefulCheckbox />)

storiesOf("Task", module)
  .add("incomplete task", () => (
    <Task
      isComplete={false}
      text="Get coffee"
      onIsCompleteChange={action("isComplete change")}
      onTextChange={action("text change")}
      onDelete={action("delete")}
    />
  ))
  .add("complete task", () => (
    <Task
      isComplete={true}
      text="Do laundry"
      onIsCompleteChange={action("isComplete change")}
      onTextChange={action("text change")}
      onDelete={action("delete")}
    />
  ))
  .add("creating task", () => (
    <Task
      isCreating={true}
      isComplete={false}
      text="Write novel"
      onIsCompleteChange={action("isComplete change")}
      onTextChange={action("text change")}
      onDelete={action("delete")}
    />
  ))
