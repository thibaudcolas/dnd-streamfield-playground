import React from 'react';
import ReactDOM from 'react-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './index.css';

const SEPARATOR = '-';
const DROPPABLE_PREFIX = 'root' + SEPARATOR;

class Block extends React.Component {
  get className() {
    let className = 'block';
    if (this.props.closed) {
      className += ' closed';
    }
    return className;
  }

  close() {
    const container = this.refs.contentContainer;
    const content = this.refs.content;
    container.style.maxHeight = content.clientHeight.toString() + 'px';
    this.props.closeHandler(this.props.path);
    setTimeout(
      function() {
        container.style.maxHeight = '';
      }.bind(this),
      50,
    );
  }

  open() {
    const container = this.refs.contentContainer;
    const content = this.refs.content;
    container.style.maxHeight = '0px';
    setTimeout(
      function() {
        container.style.maxHeight = content.offsetHeight.toString() + 'px';
        this.props.openHandler(this.props.path);
        setTimeout(function() {
          container.style.maxHeight = '';
        }, 300);
      }.bind(this),
      50,
    );
  }

  toggle() {
    if (this.props.closed) {
      this.open();
    } else {
      this.close();
    }
  }

  addHandler() {
    this.props.addHandler(this.props.path);
  }

  moveUpHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.moveUpHandler(this.props.path);
  }

  moveDownHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.moveDownHandler(this.props.path);
  }

  duplicateHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.duplicateHandler(this.props.path);
  }

  deleteHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.deleteHandler(this.props.path);
  }

  render() {
    return (
      <article
        className={this.className}
        ref={this.props.provided.innerRef}
        {...this.props.provided.draggableProps}
        style={this.props.provided.draggableProps.style}
      >
        <div className="block-container">
          <header
            onClick={this.toggle.bind(this)}
            {...this.props.provided.dragHandleProps}
          >
            <h3>{this.props.title}</h3>
            <aside>
              <div className="type">{this.props.type}</div>
              <div className="actions">
                <button onClick={this.moveUpHandler.bind(this)} title="Move up">
                  ↑
                </button>
                <button
                  onClick={this.moveDownHandler.bind(this)}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={this.duplicateHandler.bind(this)}
                  title="Duplicate"
                >
                  🗊
                </button>
                <button onClick={this.deleteHandler.bind(this)} title="Delete">
                  🗑 ️
                </button>
              </div>
            </aside>
          </header>

          <section ref="contentContainer">
            <div className="content" ref="content">
              <div className="field-row-panel">
                <label>
                  Start date:
                  <input type="text" />
                </label>
                <label>
                  End date:
                  <input type="text" />
                </label>
              </div>
              <StreamFieldChildren
                path={this.props.path}
                prefix={this.props.prefix}
                blocks={this.props.children}
                openHandler={this.props.openHandler}
                addHandler={this.props.addHandler}
                closeHandler={this.props.closeHandler}
                moveUpHandler={this.props.moveUpHandler}
                moveDownHandler={this.props.moveDownHandler}
                duplicateHandler={this.props.duplicateHandler}
                deleteHandler={this.props.deleteHandler}
              />
            </div>
          </section>
        </div>
        <button onClick={this.addHandler.bind(this)} className="add after">
          +
        </button>
      </article>
    );
  }
}

class StreamFieldChildren extends React.Component {
  renderBlock(data, index, droppableType) {
    let path = this.props.path.concat(index);
    let key = DROPPABLE_PREFIX + path.join(SEPARATOR);
    return (
      <Draggable key={key} draggableId={key} index={index} type={droppableType}>
        {(provided, snapshot) => (
          <Block
            path={path}
            prefix={this.props.prefix + SEPARATOR + index.toString()}
            index={data.id}
            title={data.title}
            type={data.type}
            closed={data.closed}
            children={data.children}
            provided={provided}
            addHandler={this.props.addHandler}
            openHandler={this.props.openHandler}
            closeHandler={this.props.closeHandler}
            moveUpHandler={this.props.moveUpHandler}
            moveDownHandler={this.props.moveDownHandler}
            duplicateHandler={this.props.duplicateHandler}
            deleteHandler={this.props.deleteHandler}
          />
        )}
      </Draggable>
    );
  }

  render() {
    let droppableId = DROPPABLE_PREFIX + this.props.path.join(SEPARATOR);
    let droppableType = droppableId;
    return (
      <Droppable droppableId={droppableId} type={droppableType}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} className="stream-field">
            <button
              onClick={() =>
                this.props.addHandler(
                  this.props.path.concat(this.props.blocks.length - 1),
                )
              }
              className="add"
            >
              +
            </button>
            {this.props.blocks.map((data, index) =>
              this.renderBlock(data, index, droppableType),
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  }
}

class StreamField extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      blocks: props.blocks,
    };
  }

  getBlock(path, rootBlocks = null) {
    if (rootBlocks === null) {
      rootBlocks = this.state.blocks.slice();
    }
    let newParentBlocks = rootBlocks;
    let parentBlocks;
    let block = null;
    for (let i of path) {
      parentBlocks = newParentBlocks;
      block = parentBlocks[i];
      newParentBlocks = block.children;
    }
    return [rootBlocks, parentBlocks, block];
  }

  onDragEnd(result) {
    if (!result.destination || result.reason === 'CANCEL') {
      return;
    }

    function droppableIdToPath(droppableId) {
      if (droppableId === DROPPABLE_PREFIX) {
        return [];
      }
      return droppableId
        .substring(DROPPABLE_PREFIX.length)
        .split(SEPARATOR)
        .map(Number);
    }
    let sourcePath = droppableIdToPath(result.source.droppableId);
    let destinationPath = droppableIdToPath(result.destination.droppableId);
    let [rootBlocks, , source] = this.getBlock(sourcePath);
    let [, , destination] = this.getBlock(destinationPath, rootBlocks);
    source = source === null ? rootBlocks : source.children;
    destination = destination === null ? rootBlocks : destination.children;

    let [moved] = source.splice(result.source.index, 1);
    destination.splice(result.destination.index, 0, moved);
    this.setState({ blocks: rootBlocks });
  }

  openHandler(path) {
    let [rootBlocks, , block] = this.getBlock(path);
    block.closed = false;
    this.setState({ blocks: rootBlocks });
  }

  closeHandler(path) {
    let [rootBlocks, , block] = this.getBlock(path);
    block.closed = true;
    this.setState({ blocks: rootBlocks });
  }

  addHandler(path) {
    this.duplicateHandler(path);
  }

  moveHandler(path, offset) {
    let [rootBlocks, parentBlocks, block] = this.getBlock(path);
    const oldIndex = parentBlocks.indexOf(block);
    const newIndex = oldIndex + offset;
    if (newIndex <= -1 || newIndex >= parentBlocks.length) {
      return;
    }
    parentBlocks.splice(newIndex, 0, parentBlocks.splice(oldIndex, 1)[0]);
    this.setState({ blocks: rootBlocks });
  }

  moveUpHandler(path) {
    this.moveHandler(path, -1);
  }

  moveDownHandler(path) {
    this.moveHandler(path, 1);
  }

  duplicateHandler(path) {
    let [rootBlocks, parentBlocks, block] = this.getBlock(path);
    let newBlock = JSON.parse(JSON.stringify(block));
    parentBlocks.splice(parentBlocks.indexOf(block), 0, newBlock);
    this.setState({ blocks: rootBlocks });
  }

  deleteHandler(path) {
    let [rootBlocks, parentBlocks, block] = this.getBlock(path);
    parentBlocks.splice(parentBlocks.indexOf(block), 1);
    this.setState({ blocks: rootBlocks });
  }

  render() {
    return (
      <DragDropContext onDragEnd={this.onDragEnd.bind(this)}>
        <StreamFieldChildren
          path={[]}
          prefix={this.props.prefix}
          blocks={this.state.blocks}
          openHandler={this.openHandler.bind(this)}
          closeHandler={this.closeHandler.bind(this)}
          addHandler={this.addHandler.bind(this)}
          moveUpHandler={this.moveUpHandler.bind(this)}
          moveDownHandler={this.moveDownHandler.bind(this)}
          duplicateHandler={this.duplicateHandler.bind(this)}
          deleteHandler={this.deleteHandler.bind(this)}
        />
      </DragDropContext>
    );
  }
}

ReactDOM.render(
  <StreamField
    prefix="root"
    blocks={Array(50)
      .fill(null)
      .map((_, i) => ({
        id: i.toString(),
        title: '♡ Some love ' + i.toString(),
        type: 'Block type',
        closed: true,
        children: [
          {
            id: i.toString() + '-0',
            title: '♥ More love',
            type: 'Sub-block type',
            closed: true,
            children: [
              {
                id: i.toString() + '-0-0',
                title: '🐮 Cute cow 0',
                type: 'Sub-sub-block type',
                closed: true,
                children: [],
              },
            ],
          },
          {
            id: i.toString() + '-1',
            title: '♥ Even more love',
            type: 'Sub-block type',
            closed: true,
            children: [],
          },
        ],
      }))}
  />,
  document.getElementById('root'),
);
