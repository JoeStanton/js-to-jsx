let {DOM} = require("react");

export default function ({types: t}) {
  const getAttributes = (props) => {
    if (t.isIdentifier(props)) {
      return [t.JSXSpreadAttribute(props)];
    }

    return (props && props.properties || []).map(prop => {
      const value = t.isLiteral(prop.value) && (typeof prop.value.value === 'string') ? prop.value : t.JSXExpressionContainer(prop.value);
      return t.JSXAttribute(t.JSXIdentifier(prop.key.name), value);
    });
  }

  return {
    visitor: {
      CallExpression: {
        enter: function (path) {
          if (Object.keys(DOM).indexOf(path.node.callee.name) === -1) return;

          var props = getAttributes(path.node.arguments[0]);
          var children = path.node.arguments.slice(1);

          var name = t.JSXIdentifier(path.node.callee.name);

          var open = t.JSXOpeningElement(name, props);
          open.selfClosing = children.length === 0;
          var close = children.length === 0 ? null : t.JSXClosingElement(name);

          var el = t.JSXElement(open, close, children);
          path.replaceWith(path.parent.type === 'ReturnStatement' ? t.ParenthesizedExpression(el) : t.ExpressionStatement(el));
        }
      },
      JSXElement: {
        exit: function(path) {
          path.node.children = path.node.children.map(c => {
            if (t.isJSXElement(c) || t.isStringLiteral(c) || t.isJSXExpressionContainer(c)) {
              return t.isStringLiteral(c) ? t.JSXText(c.value) : c;
            } else {
              return t.JSXExpressionContainer(c);
            }
          });
          path.replaceWith(path.node);
        }
      },
      ConditionalExpression: function(path) {
        if (path.node.alternate.operator === 'void') {
          path.replaceWith(t.LogicalExpression("&&", path.node.test, path.node.consequent));
        }
      }
    }
  }
}
