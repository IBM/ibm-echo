/*
 * Copyright IBM Corp. 2024 - 2024
 * SPDX-License-Identifier: Apache-2.0
 */

import { Add, FolderParent, WatsonHealth3DCurveManual, Meter, Share } from "@carbon/react/icons";
import { Button, OverflowMenu, OverflowMenuItem, TreeNode, TreeView, Tag } from "@carbon/react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { GlobalStore } from "../contexts/GlobalContext";
import { Modal, TextInput } from "@carbon/react";
import { customAlphabet } from "nanoid";
import ImportCollectionModal from "./ImportCollectionModal";
import ExportCollectionModal from "./ExportCollectionModal";

function CollectionsView(props) {
	const { globalStore, setGlobalStore, activateItem, deleteItemById, updateItemById, changeItemLocation, addNew } =
		useContext(GlobalStore);

	const [showAddCollectionModal, setShowAddCollectionModal] = useState(false);
	const [newCollectionName, setNewCollectionName] = useState("");
	const [isNewCollectionNameValid, setIsNewCollectionNameValid] = useState(0);
	const [isNewCollectionNameValidText, setIsNewCollectionNameValidText] = useState("");
	const [showImportCollectionModal, setShowImportCollectionModal] = useState(false);
	const [updatedCollectionName, setUpdatedCollectionName] = useState("");
	const [showEditCollectionModal, setShowEditCollectionModal] = useState(false);
	const [isUpdatedCollectionNameValid, setIsUpdatedCollectionNameValid] = useState(0);
	const [isUpdatedCollectionNameValidText, setIsUpdatedCollectionNameValidText] = useState("");
	const [selectedItem, setSelectedItem] = useState(undefined);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showExportCollectionModal, setShowExportCollectionModal] = useState(false);
	const [exportCollectionProps, setExportCollectionProps] = useState(null);

	const nanoid = customAlphabet("1234567890abcdef", 10);
	const dragOverRef = useRef([]);
	const whichElementDraggedRef = useRef(null);

	const handleSelectRequest = (request) => {
		if (request.type === "group") {
			return;
		}

		activateItem(request.id, true);
	};

	const handleDelete = (event, request) => {
		event.stopPropagation();
		deleteItemById(request.id);
		setShowDeleteModal(false);
		setSelectedItem(undefined);
	};

	const getColorScheme = (method) => {
		if (method === "GET") return "green";
		if (method === "DELETE") return "red";
		if (method === "PUT") return "orange";
		if (method === "POST") return "teal";
		return "grey";
	};

	const createCollection = () => {
		if (isNewCollectionNameValid == -1 || newCollectionName.length == 0) {
			setIsNewCollectionNameValid(-1);
			setIsNewCollectionNameValidText("Please enter a valid collection name!");
			return;
		}

		let storeCopy = JSON.parse(JSON.stringify(globalStore));
		let collection = {
			type: "group",
			name: newCollectionName,
			id: nanoid(),
			items: []
		};
		let apis = [collection, ...storeCopy.apis];
		storeCopy.apis = apis;
		setGlobalStore(storeCopy);

		// Clear data from modal and close it
		closeAddCollectionModal();
	};

	const onNewCollectionNameChange = (event) => {
		let collectionName = event.target.value;
		setNewCollectionName(collectionName);

		if (collectionName) {
			setIsNewCollectionNameValid(1);
			setIsNewCollectionNameValidText("");
		} else {
			setIsNewCollectionNameValid(0);
			setIsNewCollectionNameValidText("");
		}
	};

	const closeAddCollectionModal = () => {
		setNewCollectionName("");
		setIsNewCollectionNameValid(0);
		setIsNewCollectionNameValidText("");
		setShowAddCollectionModal(false);
	};

	const handleShowCollectionModal = () => {
		setShowImportCollectionModal(true);
	};

	const handleCloseCollectionModal = () => {
		setShowImportCollectionModal(false);
	};

	const closeExportCollectionModal = () => {
		setShowExportCollectionModal(false);
		setExportCollectionProps(null);
	};

	const handleDragStart = (evt, elem) => {
		evt.stopPropagation();
		if (elem.name === "Untitled *" || elem.type === "group") {
			evt.preventDefault();
			return;
		}

		evt.dataTransfer.setData("json", JSON.stringify(elem));

		let p = document.createElement("p");
		p.innerHTML = elem.name;
		p.classList.add("draggedItem");
		document.querySelector(".hiddenDiv").appendChild(p);
		evt.dataTransfer.setDragImage(p, 0, 0);
		whichElementDraggedRef.current = elem;
	};

	const handleDragEnd = (evt, elem) => {
		let ps = document.querySelectorAll(".draggedItem");
		Array.from(ps).forEach((p) => p.remove());
		whichElementDraggedRef.current = null;
	};

	const handleDragOver = (evt, elem) => {
		evt.stopPropagation();
		evt.preventDefault();
		evt.persist();
	};

	const handleDrop = (evt, elem) => {
		evt.stopPropagation();
		if (
			(whichElementDraggedRef.current.type === "request" || whichElementDraggedRef.current.type === "chain") &&
			elem.type === "group"
		) {
			changeItemLocation(elem.id, whichElementDraggedRef.current);
		}
		whichElementDraggedRef.current = null;
	};

	const handleAddNew = (nodeProps, type) => {
		let createdId = addNew(nodeProps?.id || null, type);
	};

	const exportCollection = (nodeProps) => {
		setShowExportCollectionModal(true);
		setExportCollectionProps(nodeProps);
	};

	const handleRequestName = (nodeProps, eve) => {
		let elem = document.getElementById(`collectionsView-requestName-${nodeProps.id}`);
		if (elem.innerText.trim().length === 0) {
			elem.innerText = nodeProps.name;
		}

		if (elem.innerText.trim().length > 0 && elem.innerText.toLowerCase().includes("untitled")) {
			elem.innerText = nodeProps.name;
		} else {
			updateItemById(nodeProps.id, "name", elem.innerText);
		}
	};

	const handleOnKeyPress = (eve) => {
		eve.stopPropagation();
	};

	const renderTree = ({ nodes }) => {
		if (!nodes) {
			return;
		}
		return nodes.map(({ items, ...nodeProps }) => {
			return (
				<TreeNode
					id={nodeProps.id}
					key={nodeProps.id}
					isExpanded={nodeProps.isExpanded}
					className={
						nodeProps.isActive
							? `cds--tree-node--active cds--tree-node--selected type-${nodeProps.type}`
							: `type-${nodeProps.type}`
					}
					draggable={true}
					onDragStart={(evt) => handleDragStart(evt, nodeProps)}
					onDragEnd={(evt) => handleDragEnd(evt, nodeProps)}
					onDragOver={(evt) => handleDragOver(evt, nodeProps)}
					onDrop={(evt) => handleDrop(evt, nodeProps)}
					label={
						<div className="treeNode">
							{nodeProps.type === "group" && <FolderParent />}
							{nodeProps.type === "chain" && (
								<Tag
									size="md"
									type={"high-contrast"}
									renderIcon={WatsonHealth3DCurveManual}
								></Tag>
							)}
							{nodeProps.type === "request" && (
								<Tag
									size="md"
									type={getColorScheme(nodeProps.method)}
								>
									{nodeProps.method}
								</Tag>
							)}
							{nodeProps.type === "runTest" && (
								<Tag
									size="md"
									renderIcon={Meter}
								></Tag>
							)}
							{nodeProps.type === "apiDoc" && (
								<Tag
									size="md"
									renderIcon={Document}
									type="purple"
								></Tag>
							)}
							<span
								className={`treeNode-label`}
								suppressContentEditableWarning={true}
								contentEditable={nodeProps.isActive}
								id={`collectionsView-requestName-${nodeProps.id}`}
								onKeyDown={handleOnKeyPress}
								onBlur={(eve) => handleRequestName(nodeProps, eve)}
							>
								{nodeProps.name}
							</span>
							{nodeProps.type !== "group" && (
								<OverflowMenu
									aria-label="overflow-menu"
									size="sm"
									align="left"
								>
									<OverflowMenuItem
										isDelete
										itemText={"Delete request"}
										onClick={(e) => editOrDeleteSelectedItem(e, nodeProps, "delete")}
									/>
								</OverflowMenu>
							)}
							{nodeProps.type === "group" && nodeProps.isShared && (
								<Tag
									size="md"
									renderIcon={Share}
								></Tag>
							)}
							{nodeProps.type === "group" && (
								<OverflowMenu
									aria-label="overflow-menu"
									size="md"
									align="left"
								>
									<OverflowMenuItem
										itemText={"Edit group name"}
										onClick={(e) => editOrDeleteSelectedItem(e, nodeProps, "edit")}
									/>
									<OverflowMenuItem
										itemText={`+ Add new group`}
										onClick={() => handleAddNew(nodeProps, "group")}
									/>
									<OverflowMenuItem
										itemText={`+ Add new request`}
										onClick={() => handleAddNew(nodeProps, "request")}
									/>
									<OverflowMenuItem
										itemText={`+ Add new chain`}
										onClick={() => handleAddNew(nodeProps, "chain")}
									/>
									<OverflowMenuItem
										itemText={"Test runner"}
										onClick={(e) => handleAddNew(nodeProps, "runTest")}
									/>
									<OverflowMenuItem
										itemText={"Export"}
										onClick={(e) => exportCollection(nodeProps)}
									/>
									<OverflowMenuItem
										isDelete
										itemText={"Delete group"}
										onClick={(e) => editOrDeleteSelectedItem(e, nodeProps, "delete")}
									/>
								</OverflowMenu>
							)}
						</div>
					}
					onSelect={() => handleSelectRequest(nodeProps)}
				>
					{renderTree({
						nodes: items
					})}
				</TreeNode>
			);
		});
	};
	const editCollection = () => {
		if (isUpdatedCollectionNameValid == -1 || updatedCollectionName.length == 0) {
			setIsUpdatedCollectionNameValid(-1);
			setIsUpdatedCollectionNameValidText("Please enter a valid collection name!");
			return;
		}

		updateItemById(selectedItem.id, "name", updatedCollectionName);

		// Clear data from modal and close it
		closeEditCollectionModal();
		setSelectedItem(undefined);
	};

	const onEditCollectionNameChange = (event) => {
		let collectionName = event.target.value;
		setUpdatedCollectionName(collectionName);

		if (collectionName) {
			setIsUpdatedCollectionNameValid(1);
			setIsUpdatedCollectionNameValidText("");
		} else {
			setIsUpdatedCollectionNameValid(0);
			setIsUpdatedCollectionNameValidText("");
		}
	};

	const closeEditCollectionModal = () => {
		setUpdatedCollectionName("");
		setIsUpdatedCollectionNameValid(0);
		setIsUpdatedCollectionNameValidText("");
		setShowEditCollectionModal(false);
	};

	const editOrDeleteSelectedItem = (event, item, action) => {
		setSelectedItem(item);

		if (action === "delete") {
			setShowDeleteModal(true);
		} else {
			setUpdatedCollectionName(item.name);
			setIsUpdatedCollectionNameValid(1);
			setShowEditCollectionModal(true);
		}
	};

	const closeDeleteModal = () => {
		setSelectedItem(undefined);
		setShowDeleteModal(false);
	};

	return (
		<div
			className="tool-collections"
			onDrop={(evt) => handleDrop(evt, nodeProps)}
		>
			{showAddCollectionModal && (
				<Modal
					size="sm"
					open={showAddCollectionModal}
					modalHeading="Create a new collection"
					primaryButtonText="Create"
					secondaryButtonText="Cancel"
					onRequestClose={closeAddCollectionModal}
					onRequestSubmit={createCollection}
					value={newCollectionName}
				>
					<TextInput
						data-modal-primary-focus
						id="new-collection-name"
						labelText="Collection name"
						placeholder="Enter collection name"
						autoComplete="off"
						style={{ marginBottom: "1rem" }}
						invalid={isNewCollectionNameValid === -1}
						invalidText={isNewCollectionNameValidText}
						value={newCollectionName}
						onChange={onNewCollectionNameChange}
					/>
				</Modal>
			)}

			{showImportCollectionModal && <ImportCollectionModal handleCloseCollectionModal={handleCloseCollectionModal} />}

			{showEditCollectionModal && (
				<Modal
					size="sm"
					open={showEditCollectionModal}
					modalHeading="Edit Collection Name"
					primaryButtonText="Update"
					secondaryButtonText="Cancel"
					onRequestClose={closeEditCollectionModal}
					onRequestSubmit={editCollection}
				>
					<TextInput
						data-modal-primary-focus
						id="edit-collection-name"
						labelText="Collection name"
						placeholder="Enter new collection name"
						autoComplete="off"
						style={{ marginBottom: "1rem" }}
						invalid={isUpdatedCollectionNameValid === -1}
						invalidText={isUpdatedCollectionNameValidText}
						value={updatedCollectionName}
						onChange={onEditCollectionNameChange}
					/>
				</Modal>
			)}

			{showDeleteModal && (
				<Modal
					size="sm"
					open={showDeleteModal}
					modalHeading={selectedItem.type === "group" ? "Delete collection?" : "Delete API?"}
					primaryButtonText="Delete"
					secondaryButtonText="Cancel"
					danger="true"
					onRequestClose={closeDeleteModal}
					onRequestSubmit={(e) => handleDelete(e, selectedItem)}
				>
					<p>
						{selectedItem.name || selectedItem.collectionId
							? `Are you sure that you want to delete ${selectedItem.type} ${
									selectedItem.name ? selectedItem.name : selectedItem.title
								}?`
							: "All unsaved changes will be lost. Are you sure you want to delete this request?"}
					</p>
				</Modal>
			)}

			{showExportCollectionModal && (
				<ExportCollectionModal
					closeExportCollectionModal={closeExportCollectionModal}
					exportCollectionProps={exportCollectionProps}
				/>
			)}

			<div className="tool-collectionOptions">
				<Button
					className="tool-addNewRequest"
					renderIcon={Add}
					size="lg"
					kind="ghost"
					onClick={() => setShowAddCollectionModal(true)}
				>
					Add new collection
				</Button>
				<OverflowMenu
					aria-label="overflow-menu"
					size="lg"
				>
					<OverflowMenuItem
						itemText="Import collection"
						onClick={handleShowCollectionModal}
					/>
					<OverflowMenuItem
						itemText="Add new chain "
						onClick={() => handleAddNew(null, "chain")}
					/>
				</OverflowMenu>
			</div>
			<TreeView
				label="Tree View"
				hideLabel={true}
				className="treeView"
				selected={[globalStore.selectedNode]}
			>
				{renderTree({
					nodes: globalStore.apis,
					withIcons: true
				})}
			</TreeView>
			<div className="hiddenDiv"></div>
		</div>
	);
}

export default CollectionsView;
