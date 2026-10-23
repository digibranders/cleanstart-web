export default function VideosLibraryLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}): React.ReactElement {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
